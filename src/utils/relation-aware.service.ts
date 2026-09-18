import type { EntityMetadata, ObjectLiteral, Repository } from 'typeorm';

/**
 * Shared base for services whose root GraphQL queries eager-load relations via
 * `getRequestedRelations(info, service.entityMetadata)` — removes the identical
 * `entityMetadata` getter that used to be copy-pasted onto each of those services.
 */
export abstract class RelationAwareService<T extends ObjectLiteral> {
  protected abstract get repository(): Repository<T>;

  get entityMetadata(): EntityMetadata {
    return this.repository.metadata;
  }
}
