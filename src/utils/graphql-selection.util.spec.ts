import { Kind, parse, type FieldNode, type FragmentDefinitionNode, type GraphQLResolveInfo } from 'graphql';
import type { EntityMetadata } from 'typeorm';

import { MAX_RELATION_DEPTH, getRequestedRelations } from './graphql-selection.util';

/** Minimal stand-in for the slice of EntityMetadata the helper walks, wired into the same cycles as the real entities. */
type FakeMetadata = { relations: { propertyName: string; inverseEntityMetadata: FakeMetadata }[] };

const postMetadata: FakeMetadata = { relations: [] };
const userMetadata: FakeMetadata = { relations: [] };
const commentMetadata: FakeMetadata = { relations: [] };
const categoryMetadata: FakeMetadata = { relations: [] };
const avatarMetadata: FakeMetadata = { relations: [] };

postMetadata.relations = [
  { propertyName: 'author', inverseEntityMetadata: userMetadata },
  { propertyName: 'categories', inverseEntityMetadata: categoryMetadata },
  { propertyName: 'comments', inverseEntityMetadata: commentMetadata },
];
userMetadata.relations = [
  { propertyName: 'posts', inverseEntityMetadata: postMetadata },
  { propertyName: 'avatar', inverseEntityMetadata: avatarMetadata },
];
commentMetadata.relations = [
  { propertyName: 'post', inverseEntityMetadata: postMetadata },
  { propertyName: 'author', inverseEntityMetadata: userMetadata },
];
categoryMetadata.relations = [{ propertyName: 'posts', inverseEntityMetadata: postMetadata }];

const postEntityMetadata = postMetadata as unknown as EntityMetadata;

function buildInfo(query: string): GraphQLResolveInfo {
  const document = parse(query);
  const operation = document.definitions.find((definition) => definition.kind === Kind.OPERATION_DEFINITION);
  const fragments: Record<string, FragmentDefinitionNode> = {};

  for (const definition of document.definitions) {
    if (definition.kind === Kind.FRAGMENT_DEFINITION) {
      fragments[definition.name.value] = definition;
    }
  }

  if (operation?.kind !== Kind.OPERATION_DEFINITION) {
    throw new Error('query must contain an operation');
  }

  const fieldNodes = operation.selectionSet.selections.filter(
    (selection): selection is FieldNode => selection.kind === Kind.FIELD,
  );

  return { fieldNodes, fragments } as unknown as GraphQLResolveInfo;
}

describe('getRequestedRelations', () => {
  it('returns only the relations the query selected, ignoring scalar fields', () => {
    const info = buildInfo(`{ post(id: 1) { id title author { name } } }`);

    expect(getRequestedRelations(info, postEntityMetadata)).toEqual(['author']);
  });

  it('returns an empty list when no relation is selected', () => {
    const info = buildInfo(`{ post(id: 1) { id title } }`);

    expect(getRequestedRelations(info, postEntityMetadata)).toEqual([]);
  });

  it('walks relations of relations into dotted paths', () => {
    const info = buildInfo(`{ post(id: 1) { comments { content author { name posts { title } } } } }`);

    expect(getRequestedRelations(info, postEntityMetadata).sort()).toEqual([
      'comments',
      'comments.author',
      'comments.author.posts',
    ]);
  });

  it(`stops descending after ${MAX_RELATION_DEPTH} levels`, () => {
    // Chain relations two levels past the cap to prove the excess is dropped, not just coincidentally absent.
    const chain = ['comments', 'author', 'posts'];
    const relationAt = (level: number) => chain[(level - 1) % chain.length];

    let query = 'name';
    for (let level = MAX_RELATION_DEPTH + 2; level >= 1; level--) {
      query = `${relationAt(level)} { ${query} }`;
    }
    const info = buildInfo(`{ post(id: 1) { ${query} } }`);

    const expectedPaths: string[] = [];
    let path = '';
    for (let level = 1; level <= MAX_RELATION_DEPTH; level++) {
      path = path ? `${path}.${relationAt(level)}` : relationAt(level);
      expectedPaths.push(path);
    }

    expect(getRequestedRelations(info, postEntityMetadata).sort()).toEqual(expectedPaths.sort());
  });

  it('collects relations across sibling branches and parents of nested paths', () => {
    const info = buildInfo(`{ post(id: 1) { author { avatar { url } } categories { name } } }`);

    expect(getRequestedRelations(info, postEntityMetadata).sort()).toEqual(['author', 'author.avatar', 'categories']);
  });

  it('resolves fragment spreads and inline fragments', () => {
    const info = buildInfo(`
      {
        post(id: 1) {
          ...PostParts
          ... on Post {
            categories { name }
          }
        }
      }
      fragment PostParts on Post {
        comments { author { name } }
      }
    `);

    expect(getRequestedRelations(info, postEntityMetadata).sort()).toEqual([
      'categories',
      'comments',
      'comments.author',
    ]);
  });
});
