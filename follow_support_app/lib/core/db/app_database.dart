import 'package:drift/drift.dart';
import 'package:drift_flutter/drift_flutter.dart';
import '../domain.dart';
part 'app_database.g.dart';

@DataClassName('OperatingAccount')
class OperatingAccounts extends Table {
  TextColumn get id => text()();
  TextColumn get platform => textEnum<PlatformType>()();
  TextColumn get displayName => text()();
  BoolColumn get archived => boolean().withDefault(const Constant(false))();
  BoolColumn get isSample => boolean().withDefault(const Constant(false))();
  IntColumn get cumulativeFollows => integer().withDefault(const Constant(0))();
  BoolColumn get breakNoticeShown =>
      boolean().withDefault(const Constant(false))();
  DateTimeColumn get createdAt => dateTime()();
  @override
  Set<Column> get primaryKey => {id};
}

@DataClassName('TargetAccount')
@TableIndex(
  name: 'target_work',
  columns: {#platform, #status, #importedAt, #id},
)
@TableIndex(
  name: 'target_owner_follow',
  columns: {#ownerId, #status, #followedAt},
)
class Targets extends Table {
  TextColumn get id => text()();
  TextColumn get platform => textEnum<PlatformType>()();
  TextColumn get username => text()();
  TextColumn get normalizedUsername => text()();
  TextColumn get profileUrl => text()();
  TextColumn get ownerId =>
      text().nullable().references(OperatingAccounts, #id)();
  TextColumn get status =>
      textEnum<TargetStatus>().withDefault(const Constant('pending'))();
  TextColumn get memo => text().withDefault(const Constant(''))();
  TextColumn get groupName => text().withDefault(const Constant(''))();
  BoolColumn get isSample => boolean().withDefault(const Constant(false))();
  DateTimeColumn get importedAt => dateTime()();
  DateTimeColumn get processedAt => dateTime().nullable()();
  DateTimeColumn get followedAt => dateTime().nullable()();
  DateTimeColumn get lastOpenedAt => dateTime().nullable()();
  IntColumn get openCount => integer().withDefault(const Constant(0))();
  DateTimeColumn get createdAt => dateTime()();
  DateTimeColumn get updatedAt => dateTime()();
  @override
  Set<Column> get primaryKey => {id};
  @override
  List<Set<Column>> get uniqueKeys => [
    {platform, normalizedUsername},
  ];
}

@TableIndex(name: 'logs_owner_time', columns: {#ownerId, #occurredAt})
class ActionLogs extends Table {
  TextColumn get id => text()();
  TextColumn get targetId => text()();
  TextColumn get ownerId => text().references(OperatingAccounts, #id)();
  TextColumn get platform => textEnum<PlatformType>()();
  TextColumn get actionType => textEnum<ActionType>()();
  TextColumn get statusBefore => textEnum<TargetStatus>().nullable()();
  TextColumn get statusAfter => textEnum<TargetStatus>().nullable()();
  TextColumn get note => text().withDefault(const Constant(''))();
  DateTimeColumn get occurredAt => dateTime()();
  @override
  Set<Column> get primaryKey => {id};
}

class AppSettings extends Table {
  TextColumn get key => text()();
  TextColumn get value => text()();
  @override
  Set<Column> get primaryKey => {key};
}

@DriftDatabase(tables: [OperatingAccounts, Targets, ActionLogs, AppSettings])
class AppDatabase extends _$AppDatabase {
  AppDatabase([QueryExecutor? executor])
    : super(executor ?? driftDatabase(name: 'follow_support'));
  @override
  int get schemaVersion => 1;
  @override
  MigrationStrategy get migration => MigrationStrategy(
    onCreate: (m) => m.createAll(),
    beforeOpen: (_) async {
      await customStatement('PRAGMA foreign_keys = ON');
    },
  );
}
