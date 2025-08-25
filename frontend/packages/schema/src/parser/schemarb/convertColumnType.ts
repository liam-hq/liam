// https://github.com/rails/rails/blob/v8.0.0/activerecord/lib/active_record/connection_adapters/postgresql_adapter.rb#L134-L179
const mapping: Record<string, string> = {
  // primary_key: // should be handled separately
  string: 'varchar',
  text: 'text',
  integer: 'integer',
  bigint: 'bigint',
  float: 'float',
  decimal: 'decimal',
  datetime: 'timestamp', // set dynamically based on datetime_type, and default is 'timestamp' https://github.com/rails/rails/pull/41084
  timestamp: 'timestamp',
  timestamptz: 'timestamptz',
  time: 'time',
  date: 'date',
  daterange: 'daterange',
  numrange: 'numrange',
  tsrange: 'tsrange',
  tstzrange: 'tstzrange',
  int4range: 'int4range',
  int8range: 'int8range',
  binary: 'bytea',
  boolean: 'boolean',
  xml: 'xml',
  tsvector: 'tsvector',
  hstore: 'hstore',
  inet: 'inet',
  cidr: 'cidr',
  macaddr: 'macaddr',
  uuid: 'uuid',
  json: 'json',
  jsonb: 'jsonb',
  ltree: 'ltree',
  citext: 'citext',
  point: 'point',
  line: 'line',
  lseg: 'lseg',
  box: 'box',
  path: 'path',
  polygon: 'polygon',
  circle: 'circle',
  bit: 'bit',
  bit_varying: 'bit varying',
  money: 'money',
  interval: 'interval',
  oid: 'oid',
  // enum: // special type. should be handled separately
}

export function convertColumnType(schemarbType: string): string {
  return mapping[schemarbType] || schemarbType
}
