import { Kind, type FieldNode, type GraphQLResolveInfo, type SelectionSetNode } from 'graphql';
import type { EntityMetadata } from 'typeorm';

import { MAX_RELATION_DEPTH } from '../constants/common';

/** Groups the FieldNodes of a selection set by field name, resolving fragment spreads and inline fragments. */
function collectFieldNodes(
  selectionSet: SelectionSetNode,
  fragments: GraphQLResolveInfo['fragments'],
): Map<string, FieldNode[]> {
  const nodes = new Map<string, FieldNode[]>();

  const add = (name: string, node: FieldNode) => {
    const existing = nodes.get(name);
    if (existing) {
      existing.push(node);
    } else {
      nodes.set(name, [node]);
    }
  };

  const merge = (nested: Map<string, FieldNode[]>) => {
    nested.forEach((fieldNodes, name) => fieldNodes.forEach((node) => add(name, node)));
  };

  for (const selection of selectionSet.selections) {
    if (selection.kind === Kind.FIELD) {
      add(selection.name.value, selection);
    } else if (selection.kind === Kind.INLINE_FRAGMENT) {
      merge(collectFieldNodes(selection.selectionSet, fragments));
    } else if (selection.kind === Kind.FRAGMENT_SPREAD) {
      const fragment = fragments[selection.name.value];
      if (fragment) {
        merge(collectFieldNodes(fragment.selectionSet, fragments));
      }
    }
  }

  return nodes;
}

function collectRelations(
  selectionSet: SelectionSetNode,
  fragments: GraphQLResolveInfo['fragments'],
  metadata: EntityMetadata,
  pathPrefix: string,
  depth: number,
  relations: Set<string>,
): void {
  if (depth > MAX_RELATION_DEPTH) {
    return;
  }

  const fieldNodes = collectFieldNodes(selectionSet, fragments);

  for (const relation of metadata.relations) {
    const nodes = fieldNodes.get(relation.propertyName);
    if (!nodes) {
      continue;
    }

    const path = pathPrefix ? `${pathPrefix}.${relation.propertyName}` : relation.propertyName;
    relations.add(path);

    for (const node of nodes) {
      if (node.selectionSet) {
        collectRelations(node.selectionSet, fragments, relation.inverseEntityMetadata, path, depth + 1, relations);
      }
    }
  }
}

/** Top-level field names selected on the current resolver's return type, resolving fragments/inline fragments. */
export function getRequestedFieldNames(info: GraphQLResolveInfo): Set<string> {
  const names = new Set<string>();

  for (const fieldNode of info.fieldNodes) {
    if (fieldNode.selectionSet) {
      collectFieldNodes(fieldNode.selectionSet, info.fragments).forEach((_nodes, name) => names.add(name));
    }
  }

  return names;
}

/**
 * TypeORM relation paths covering the relations the GraphQL query actually selected, so a root query can
 * eager-load them in one go instead of one query per parent row. Entities double as GraphQL types here, so a
 * selected field is a relation exactly when the entity metadata says so; nested selections yield dotted paths
 * (`comments.author.posts`) and recursion stops at MAX_RELATION_DEPTH.
 */
export function getRequestedRelations(info: GraphQLResolveInfo, metadata: EntityMetadata): string[] {
  const relations = new Set<string>();

  for (const fieldNode of info.fieldNodes) {
    if (fieldNode.selectionSet) {
      collectRelations(fieldNode.selectionSet, info.fragments, metadata, '', 1, relations);
    }
  }

  return Array.from(relations);
}
