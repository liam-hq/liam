// relationshipName example: "users_id_to_posts_user_id"
export const defaultRelationshipName = (
  primaryTableName: string,
  primaryColumnName: string,
  foreignTableName: string,
  foreignColumnName: string,
) =>
  `${primaryTableName}_${primaryColumnName}_to_${foreignTableName}_${foreignColumnName}`
