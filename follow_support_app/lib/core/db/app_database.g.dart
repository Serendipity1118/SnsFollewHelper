// GENERATED CODE - DO NOT MODIFY BY HAND

part of 'app_database.dart';

// ignore_for_file: type=lint
class $OperatingAccountsTable extends OperatingAccounts
    with TableInfo<$OperatingAccountsTable, OperatingAccount> {
  @override
  final GeneratedDatabase attachedDatabase;
  final String? _alias;
  $OperatingAccountsTable(this.attachedDatabase, [this._alias]);
  static const VerificationMeta _idMeta = const VerificationMeta('id');
  @override
  late final GeneratedColumn<String> id = GeneratedColumn<String>(
    'id',
    aliasedName,
    false,
    type: DriftSqlType.string,
    requiredDuringInsert: true,
  );
  @override
  late final GeneratedColumnWithTypeConverter<PlatformType, String> platform =
      GeneratedColumn<String>(
        'platform',
        aliasedName,
        false,
        type: DriftSqlType.string,
        requiredDuringInsert: true,
      ).withConverter<PlatformType>($OperatingAccountsTable.$converterplatform);
  static const VerificationMeta _displayNameMeta = const VerificationMeta(
    'displayName',
  );
  @override
  late final GeneratedColumn<String> displayName = GeneratedColumn<String>(
    'display_name',
    aliasedName,
    false,
    type: DriftSqlType.string,
    requiredDuringInsert: true,
  );
  static const VerificationMeta _archivedMeta = const VerificationMeta(
    'archived',
  );
  @override
  late final GeneratedColumn<bool> archived = GeneratedColumn<bool>(
    'archived',
    aliasedName,
    false,
    type: DriftSqlType.bool,
    requiredDuringInsert: false,
    defaultConstraints: GeneratedColumn.constraintIsAlways(
      'CHECK ("archived" IN (0, 1))',
    ),
    defaultValue: const Constant(false),
  );
  static const VerificationMeta _isSampleMeta = const VerificationMeta(
    'isSample',
  );
  @override
  late final GeneratedColumn<bool> isSample = GeneratedColumn<bool>(
    'is_sample',
    aliasedName,
    false,
    type: DriftSqlType.bool,
    requiredDuringInsert: false,
    defaultConstraints: GeneratedColumn.constraintIsAlways(
      'CHECK ("is_sample" IN (0, 1))',
    ),
    defaultValue: const Constant(false),
  );
  static const VerificationMeta _cumulativeFollowsMeta = const VerificationMeta(
    'cumulativeFollows',
  );
  @override
  late final GeneratedColumn<int> cumulativeFollows = GeneratedColumn<int>(
    'cumulative_follows',
    aliasedName,
    false,
    type: DriftSqlType.int,
    requiredDuringInsert: false,
    defaultValue: const Constant(0),
  );
  static const VerificationMeta _breakNoticeShownMeta = const VerificationMeta(
    'breakNoticeShown',
  );
  @override
  late final GeneratedColumn<bool> breakNoticeShown = GeneratedColumn<bool>(
    'break_notice_shown',
    aliasedName,
    false,
    type: DriftSqlType.bool,
    requiredDuringInsert: false,
    defaultConstraints: GeneratedColumn.constraintIsAlways(
      'CHECK ("break_notice_shown" IN (0, 1))',
    ),
    defaultValue: const Constant(false),
  );
  static const VerificationMeta _createdAtMeta = const VerificationMeta(
    'createdAt',
  );
  @override
  late final GeneratedColumn<DateTime> createdAt = GeneratedColumn<DateTime>(
    'created_at',
    aliasedName,
    false,
    type: DriftSqlType.dateTime,
    requiredDuringInsert: true,
  );
  @override
  List<GeneratedColumn> get $columns => [
    id,
    platform,
    displayName,
    archived,
    isSample,
    cumulativeFollows,
    breakNoticeShown,
    createdAt,
  ];
  @override
  String get aliasedName => _alias ?? actualTableName;
  @override
  String get actualTableName => $name;
  static const String $name = 'operating_accounts';
  @override
  VerificationContext validateIntegrity(
    Insertable<OperatingAccount> instance, {
    bool isInserting = false,
  }) {
    final context = VerificationContext();
    final data = instance.toColumns(true);
    if (data.containsKey('id')) {
      context.handle(_idMeta, id.isAcceptableOrUnknown(data['id']!, _idMeta));
    } else if (isInserting) {
      context.missing(_idMeta);
    }
    if (data.containsKey('display_name')) {
      context.handle(
        _displayNameMeta,
        displayName.isAcceptableOrUnknown(
          data['display_name']!,
          _displayNameMeta,
        ),
      );
    } else if (isInserting) {
      context.missing(_displayNameMeta);
    }
    if (data.containsKey('archived')) {
      context.handle(
        _archivedMeta,
        archived.isAcceptableOrUnknown(data['archived']!, _archivedMeta),
      );
    }
    if (data.containsKey('is_sample')) {
      context.handle(
        _isSampleMeta,
        isSample.isAcceptableOrUnknown(data['is_sample']!, _isSampleMeta),
      );
    }
    if (data.containsKey('cumulative_follows')) {
      context.handle(
        _cumulativeFollowsMeta,
        cumulativeFollows.isAcceptableOrUnknown(
          data['cumulative_follows']!,
          _cumulativeFollowsMeta,
        ),
      );
    }
    if (data.containsKey('break_notice_shown')) {
      context.handle(
        _breakNoticeShownMeta,
        breakNoticeShown.isAcceptableOrUnknown(
          data['break_notice_shown']!,
          _breakNoticeShownMeta,
        ),
      );
    }
    if (data.containsKey('created_at')) {
      context.handle(
        _createdAtMeta,
        createdAt.isAcceptableOrUnknown(data['created_at']!, _createdAtMeta),
      );
    } else if (isInserting) {
      context.missing(_createdAtMeta);
    }
    return context;
  }

  @override
  Set<GeneratedColumn> get $primaryKey => {id};
  @override
  OperatingAccount map(Map<String, dynamic> data, {String? tablePrefix}) {
    final effectivePrefix = tablePrefix != null ? '$tablePrefix.' : '';
    return OperatingAccount(
      id: attachedDatabase.typeMapping.read(
        DriftSqlType.string,
        data['${effectivePrefix}id'],
      )!,
      platform: $OperatingAccountsTable.$converterplatform.fromSql(
        attachedDatabase.typeMapping.read(
          DriftSqlType.string,
          data['${effectivePrefix}platform'],
        )!,
      ),
      displayName: attachedDatabase.typeMapping.read(
        DriftSqlType.string,
        data['${effectivePrefix}display_name'],
      )!,
      archived: attachedDatabase.typeMapping.read(
        DriftSqlType.bool,
        data['${effectivePrefix}archived'],
      )!,
      isSample: attachedDatabase.typeMapping.read(
        DriftSqlType.bool,
        data['${effectivePrefix}is_sample'],
      )!,
      cumulativeFollows: attachedDatabase.typeMapping.read(
        DriftSqlType.int,
        data['${effectivePrefix}cumulative_follows'],
      )!,
      breakNoticeShown: attachedDatabase.typeMapping.read(
        DriftSqlType.bool,
        data['${effectivePrefix}break_notice_shown'],
      )!,
      createdAt: attachedDatabase.typeMapping.read(
        DriftSqlType.dateTime,
        data['${effectivePrefix}created_at'],
      )!,
    );
  }

  @override
  $OperatingAccountsTable createAlias(String alias) {
    return $OperatingAccountsTable(attachedDatabase, alias);
  }

  static JsonTypeConverter2<PlatformType, String, String> $converterplatform =
      const EnumNameConverter<PlatformType>(PlatformType.values);
}

class OperatingAccount extends DataClass
    implements Insertable<OperatingAccount> {
  final String id;
  final PlatformType platform;
  final String displayName;
  final bool archived;
  final bool isSample;
  final int cumulativeFollows;
  final bool breakNoticeShown;
  final DateTime createdAt;
  const OperatingAccount({
    required this.id,
    required this.platform,
    required this.displayName,
    required this.archived,
    required this.isSample,
    required this.cumulativeFollows,
    required this.breakNoticeShown,
    required this.createdAt,
  });
  @override
  Map<String, Expression> toColumns(bool nullToAbsent) {
    final map = <String, Expression>{};
    map['id'] = Variable<String>(id);
    {
      map['platform'] = Variable<String>(
        $OperatingAccountsTable.$converterplatform.toSql(platform),
      );
    }
    map['display_name'] = Variable<String>(displayName);
    map['archived'] = Variable<bool>(archived);
    map['is_sample'] = Variable<bool>(isSample);
    map['cumulative_follows'] = Variable<int>(cumulativeFollows);
    map['break_notice_shown'] = Variable<bool>(breakNoticeShown);
    map['created_at'] = Variable<DateTime>(createdAt);
    return map;
  }

  OperatingAccountsCompanion toCompanion(bool nullToAbsent) {
    return OperatingAccountsCompanion(
      id: Value(id),
      platform: Value(platform),
      displayName: Value(displayName),
      archived: Value(archived),
      isSample: Value(isSample),
      cumulativeFollows: Value(cumulativeFollows),
      breakNoticeShown: Value(breakNoticeShown),
      createdAt: Value(createdAt),
    );
  }

  factory OperatingAccount.fromJson(
    Map<String, dynamic> json, {
    ValueSerializer? serializer,
  }) {
    serializer ??= driftRuntimeOptions.defaultSerializer;
    return OperatingAccount(
      id: serializer.fromJson<String>(json['id']),
      platform: $OperatingAccountsTable.$converterplatform.fromJson(
        serializer.fromJson<String>(json['platform']),
      ),
      displayName: serializer.fromJson<String>(json['displayName']),
      archived: serializer.fromJson<bool>(json['archived']),
      isSample: serializer.fromJson<bool>(json['isSample']),
      cumulativeFollows: serializer.fromJson<int>(json['cumulativeFollows']),
      breakNoticeShown: serializer.fromJson<bool>(json['breakNoticeShown']),
      createdAt: serializer.fromJson<DateTime>(json['createdAt']),
    );
  }
  @override
  Map<String, dynamic> toJson({ValueSerializer? serializer}) {
    serializer ??= driftRuntimeOptions.defaultSerializer;
    return <String, dynamic>{
      'id': serializer.toJson<String>(id),
      'platform': serializer.toJson<String>(
        $OperatingAccountsTable.$converterplatform.toJson(platform),
      ),
      'displayName': serializer.toJson<String>(displayName),
      'archived': serializer.toJson<bool>(archived),
      'isSample': serializer.toJson<bool>(isSample),
      'cumulativeFollows': serializer.toJson<int>(cumulativeFollows),
      'breakNoticeShown': serializer.toJson<bool>(breakNoticeShown),
      'createdAt': serializer.toJson<DateTime>(createdAt),
    };
  }

  OperatingAccount copyWith({
    String? id,
    PlatformType? platform,
    String? displayName,
    bool? archived,
    bool? isSample,
    int? cumulativeFollows,
    bool? breakNoticeShown,
    DateTime? createdAt,
  }) => OperatingAccount(
    id: id ?? this.id,
    platform: platform ?? this.platform,
    displayName: displayName ?? this.displayName,
    archived: archived ?? this.archived,
    isSample: isSample ?? this.isSample,
    cumulativeFollows: cumulativeFollows ?? this.cumulativeFollows,
    breakNoticeShown: breakNoticeShown ?? this.breakNoticeShown,
    createdAt: createdAt ?? this.createdAt,
  );
  OperatingAccount copyWithCompanion(OperatingAccountsCompanion data) {
    return OperatingAccount(
      id: data.id.present ? data.id.value : this.id,
      platform: data.platform.present ? data.platform.value : this.platform,
      displayName: data.displayName.present
          ? data.displayName.value
          : this.displayName,
      archived: data.archived.present ? data.archived.value : this.archived,
      isSample: data.isSample.present ? data.isSample.value : this.isSample,
      cumulativeFollows: data.cumulativeFollows.present
          ? data.cumulativeFollows.value
          : this.cumulativeFollows,
      breakNoticeShown: data.breakNoticeShown.present
          ? data.breakNoticeShown.value
          : this.breakNoticeShown,
      createdAt: data.createdAt.present ? data.createdAt.value : this.createdAt,
    );
  }

  @override
  String toString() {
    return (StringBuffer('OperatingAccount(')
          ..write('id: $id, ')
          ..write('platform: $platform, ')
          ..write('displayName: $displayName, ')
          ..write('archived: $archived, ')
          ..write('isSample: $isSample, ')
          ..write('cumulativeFollows: $cumulativeFollows, ')
          ..write('breakNoticeShown: $breakNoticeShown, ')
          ..write('createdAt: $createdAt')
          ..write(')'))
        .toString();
  }

  @override
  int get hashCode => Object.hash(
    id,
    platform,
    displayName,
    archived,
    isSample,
    cumulativeFollows,
    breakNoticeShown,
    createdAt,
  );
  @override
  bool operator ==(Object other) =>
      identical(this, other) ||
      (other is OperatingAccount &&
          other.id == this.id &&
          other.platform == this.platform &&
          other.displayName == this.displayName &&
          other.archived == this.archived &&
          other.isSample == this.isSample &&
          other.cumulativeFollows == this.cumulativeFollows &&
          other.breakNoticeShown == this.breakNoticeShown &&
          other.createdAt == this.createdAt);
}

class OperatingAccountsCompanion extends UpdateCompanion<OperatingAccount> {
  final Value<String> id;
  final Value<PlatformType> platform;
  final Value<String> displayName;
  final Value<bool> archived;
  final Value<bool> isSample;
  final Value<int> cumulativeFollows;
  final Value<bool> breakNoticeShown;
  final Value<DateTime> createdAt;
  final Value<int> rowid;
  const OperatingAccountsCompanion({
    this.id = const Value.absent(),
    this.platform = const Value.absent(),
    this.displayName = const Value.absent(),
    this.archived = const Value.absent(),
    this.isSample = const Value.absent(),
    this.cumulativeFollows = const Value.absent(),
    this.breakNoticeShown = const Value.absent(),
    this.createdAt = const Value.absent(),
    this.rowid = const Value.absent(),
  });
  OperatingAccountsCompanion.insert({
    required String id,
    required PlatformType platform,
    required String displayName,
    this.archived = const Value.absent(),
    this.isSample = const Value.absent(),
    this.cumulativeFollows = const Value.absent(),
    this.breakNoticeShown = const Value.absent(),
    required DateTime createdAt,
    this.rowid = const Value.absent(),
  }) : id = Value(id),
       platform = Value(platform),
       displayName = Value(displayName),
       createdAt = Value(createdAt);
  static Insertable<OperatingAccount> custom({
    Expression<String>? id,
    Expression<String>? platform,
    Expression<String>? displayName,
    Expression<bool>? archived,
    Expression<bool>? isSample,
    Expression<int>? cumulativeFollows,
    Expression<bool>? breakNoticeShown,
    Expression<DateTime>? createdAt,
    Expression<int>? rowid,
  }) {
    return RawValuesInsertable({
      if (id != null) 'id': id,
      if (platform != null) 'platform': platform,
      if (displayName != null) 'display_name': displayName,
      if (archived != null) 'archived': archived,
      if (isSample != null) 'is_sample': isSample,
      if (cumulativeFollows != null) 'cumulative_follows': cumulativeFollows,
      if (breakNoticeShown != null) 'break_notice_shown': breakNoticeShown,
      if (createdAt != null) 'created_at': createdAt,
      if (rowid != null) 'rowid': rowid,
    });
  }

  OperatingAccountsCompanion copyWith({
    Value<String>? id,
    Value<PlatformType>? platform,
    Value<String>? displayName,
    Value<bool>? archived,
    Value<bool>? isSample,
    Value<int>? cumulativeFollows,
    Value<bool>? breakNoticeShown,
    Value<DateTime>? createdAt,
    Value<int>? rowid,
  }) {
    return OperatingAccountsCompanion(
      id: id ?? this.id,
      platform: platform ?? this.platform,
      displayName: displayName ?? this.displayName,
      archived: archived ?? this.archived,
      isSample: isSample ?? this.isSample,
      cumulativeFollows: cumulativeFollows ?? this.cumulativeFollows,
      breakNoticeShown: breakNoticeShown ?? this.breakNoticeShown,
      createdAt: createdAt ?? this.createdAt,
      rowid: rowid ?? this.rowid,
    );
  }

  @override
  Map<String, Expression> toColumns(bool nullToAbsent) {
    final map = <String, Expression>{};
    if (id.present) {
      map['id'] = Variable<String>(id.value);
    }
    if (platform.present) {
      map['platform'] = Variable<String>(
        $OperatingAccountsTable.$converterplatform.toSql(platform.value),
      );
    }
    if (displayName.present) {
      map['display_name'] = Variable<String>(displayName.value);
    }
    if (archived.present) {
      map['archived'] = Variable<bool>(archived.value);
    }
    if (isSample.present) {
      map['is_sample'] = Variable<bool>(isSample.value);
    }
    if (cumulativeFollows.present) {
      map['cumulative_follows'] = Variable<int>(cumulativeFollows.value);
    }
    if (breakNoticeShown.present) {
      map['break_notice_shown'] = Variable<bool>(breakNoticeShown.value);
    }
    if (createdAt.present) {
      map['created_at'] = Variable<DateTime>(createdAt.value);
    }
    if (rowid.present) {
      map['rowid'] = Variable<int>(rowid.value);
    }
    return map;
  }

  @override
  String toString() {
    return (StringBuffer('OperatingAccountsCompanion(')
          ..write('id: $id, ')
          ..write('platform: $platform, ')
          ..write('displayName: $displayName, ')
          ..write('archived: $archived, ')
          ..write('isSample: $isSample, ')
          ..write('cumulativeFollows: $cumulativeFollows, ')
          ..write('breakNoticeShown: $breakNoticeShown, ')
          ..write('createdAt: $createdAt, ')
          ..write('rowid: $rowid')
          ..write(')'))
        .toString();
  }
}

class $TargetsTable extends Targets
    with TableInfo<$TargetsTable, TargetAccount> {
  @override
  final GeneratedDatabase attachedDatabase;
  final String? _alias;
  $TargetsTable(this.attachedDatabase, [this._alias]);
  static const VerificationMeta _idMeta = const VerificationMeta('id');
  @override
  late final GeneratedColumn<String> id = GeneratedColumn<String>(
    'id',
    aliasedName,
    false,
    type: DriftSqlType.string,
    requiredDuringInsert: true,
  );
  @override
  late final GeneratedColumnWithTypeConverter<PlatformType, String> platform =
      GeneratedColumn<String>(
        'platform',
        aliasedName,
        false,
        type: DriftSqlType.string,
        requiredDuringInsert: true,
      ).withConverter<PlatformType>($TargetsTable.$converterplatform);
  static const VerificationMeta _usernameMeta = const VerificationMeta(
    'username',
  );
  @override
  late final GeneratedColumn<String> username = GeneratedColumn<String>(
    'username',
    aliasedName,
    false,
    type: DriftSqlType.string,
    requiredDuringInsert: true,
  );
  static const VerificationMeta _normalizedUsernameMeta =
      const VerificationMeta('normalizedUsername');
  @override
  late final GeneratedColumn<String> normalizedUsername =
      GeneratedColumn<String>(
        'normalized_username',
        aliasedName,
        false,
        type: DriftSqlType.string,
        requiredDuringInsert: true,
      );
  static const VerificationMeta _profileUrlMeta = const VerificationMeta(
    'profileUrl',
  );
  @override
  late final GeneratedColumn<String> profileUrl = GeneratedColumn<String>(
    'profile_url',
    aliasedName,
    false,
    type: DriftSqlType.string,
    requiredDuringInsert: true,
  );
  static const VerificationMeta _ownerIdMeta = const VerificationMeta(
    'ownerId',
  );
  @override
  late final GeneratedColumn<String> ownerId = GeneratedColumn<String>(
    'owner_id',
    aliasedName,
    true,
    type: DriftSqlType.string,
    requiredDuringInsert: false,
    defaultConstraints: GeneratedColumn.constraintIsAlways(
      'REFERENCES operating_accounts (id)',
    ),
  );
  @override
  late final GeneratedColumnWithTypeConverter<TargetStatus, String> status =
      GeneratedColumn<String>(
        'status',
        aliasedName,
        false,
        type: DriftSqlType.string,
        requiredDuringInsert: false,
        defaultValue: const Constant('pending'),
      ).withConverter<TargetStatus>($TargetsTable.$converterstatus);
  static const VerificationMeta _memoMeta = const VerificationMeta('memo');
  @override
  late final GeneratedColumn<String> memo = GeneratedColumn<String>(
    'memo',
    aliasedName,
    false,
    type: DriftSqlType.string,
    requiredDuringInsert: false,
    defaultValue: const Constant(''),
  );
  static const VerificationMeta _groupNameMeta = const VerificationMeta(
    'groupName',
  );
  @override
  late final GeneratedColumn<String> groupName = GeneratedColumn<String>(
    'group_name',
    aliasedName,
    false,
    type: DriftSqlType.string,
    requiredDuringInsert: false,
    defaultValue: const Constant(''),
  );
  static const VerificationMeta _isSampleMeta = const VerificationMeta(
    'isSample',
  );
  @override
  late final GeneratedColumn<bool> isSample = GeneratedColumn<bool>(
    'is_sample',
    aliasedName,
    false,
    type: DriftSqlType.bool,
    requiredDuringInsert: false,
    defaultConstraints: GeneratedColumn.constraintIsAlways(
      'CHECK ("is_sample" IN (0, 1))',
    ),
    defaultValue: const Constant(false),
  );
  static const VerificationMeta _importedAtMeta = const VerificationMeta(
    'importedAt',
  );
  @override
  late final GeneratedColumn<DateTime> importedAt = GeneratedColumn<DateTime>(
    'imported_at',
    aliasedName,
    false,
    type: DriftSqlType.dateTime,
    requiredDuringInsert: true,
  );
  static const VerificationMeta _processedAtMeta = const VerificationMeta(
    'processedAt',
  );
  @override
  late final GeneratedColumn<DateTime> processedAt = GeneratedColumn<DateTime>(
    'processed_at',
    aliasedName,
    true,
    type: DriftSqlType.dateTime,
    requiredDuringInsert: false,
  );
  static const VerificationMeta _followedAtMeta = const VerificationMeta(
    'followedAt',
  );
  @override
  late final GeneratedColumn<DateTime> followedAt = GeneratedColumn<DateTime>(
    'followed_at',
    aliasedName,
    true,
    type: DriftSqlType.dateTime,
    requiredDuringInsert: false,
  );
  static const VerificationMeta _lastOpenedAtMeta = const VerificationMeta(
    'lastOpenedAt',
  );
  @override
  late final GeneratedColumn<DateTime> lastOpenedAt = GeneratedColumn<DateTime>(
    'last_opened_at',
    aliasedName,
    true,
    type: DriftSqlType.dateTime,
    requiredDuringInsert: false,
  );
  static const VerificationMeta _openCountMeta = const VerificationMeta(
    'openCount',
  );
  @override
  late final GeneratedColumn<int> openCount = GeneratedColumn<int>(
    'open_count',
    aliasedName,
    false,
    type: DriftSqlType.int,
    requiredDuringInsert: false,
    defaultValue: const Constant(0),
  );
  static const VerificationMeta _createdAtMeta = const VerificationMeta(
    'createdAt',
  );
  @override
  late final GeneratedColumn<DateTime> createdAt = GeneratedColumn<DateTime>(
    'created_at',
    aliasedName,
    false,
    type: DriftSqlType.dateTime,
    requiredDuringInsert: true,
  );
  static const VerificationMeta _updatedAtMeta = const VerificationMeta(
    'updatedAt',
  );
  @override
  late final GeneratedColumn<DateTime> updatedAt = GeneratedColumn<DateTime>(
    'updated_at',
    aliasedName,
    false,
    type: DriftSqlType.dateTime,
    requiredDuringInsert: true,
  );
  @override
  List<GeneratedColumn> get $columns => [
    id,
    platform,
    username,
    normalizedUsername,
    profileUrl,
    ownerId,
    status,
    memo,
    groupName,
    isSample,
    importedAt,
    processedAt,
    followedAt,
    lastOpenedAt,
    openCount,
    createdAt,
    updatedAt,
  ];
  @override
  String get aliasedName => _alias ?? actualTableName;
  @override
  String get actualTableName => $name;
  static const String $name = 'targets';
  @override
  VerificationContext validateIntegrity(
    Insertable<TargetAccount> instance, {
    bool isInserting = false,
  }) {
    final context = VerificationContext();
    final data = instance.toColumns(true);
    if (data.containsKey('id')) {
      context.handle(_idMeta, id.isAcceptableOrUnknown(data['id']!, _idMeta));
    } else if (isInserting) {
      context.missing(_idMeta);
    }
    if (data.containsKey('username')) {
      context.handle(
        _usernameMeta,
        username.isAcceptableOrUnknown(data['username']!, _usernameMeta),
      );
    } else if (isInserting) {
      context.missing(_usernameMeta);
    }
    if (data.containsKey('normalized_username')) {
      context.handle(
        _normalizedUsernameMeta,
        normalizedUsername.isAcceptableOrUnknown(
          data['normalized_username']!,
          _normalizedUsernameMeta,
        ),
      );
    } else if (isInserting) {
      context.missing(_normalizedUsernameMeta);
    }
    if (data.containsKey('profile_url')) {
      context.handle(
        _profileUrlMeta,
        profileUrl.isAcceptableOrUnknown(data['profile_url']!, _profileUrlMeta),
      );
    } else if (isInserting) {
      context.missing(_profileUrlMeta);
    }
    if (data.containsKey('owner_id')) {
      context.handle(
        _ownerIdMeta,
        ownerId.isAcceptableOrUnknown(data['owner_id']!, _ownerIdMeta),
      );
    }
    if (data.containsKey('memo')) {
      context.handle(
        _memoMeta,
        memo.isAcceptableOrUnknown(data['memo']!, _memoMeta),
      );
    }
    if (data.containsKey('group_name')) {
      context.handle(
        _groupNameMeta,
        groupName.isAcceptableOrUnknown(data['group_name']!, _groupNameMeta),
      );
    }
    if (data.containsKey('is_sample')) {
      context.handle(
        _isSampleMeta,
        isSample.isAcceptableOrUnknown(data['is_sample']!, _isSampleMeta),
      );
    }
    if (data.containsKey('imported_at')) {
      context.handle(
        _importedAtMeta,
        importedAt.isAcceptableOrUnknown(data['imported_at']!, _importedAtMeta),
      );
    } else if (isInserting) {
      context.missing(_importedAtMeta);
    }
    if (data.containsKey('processed_at')) {
      context.handle(
        _processedAtMeta,
        processedAt.isAcceptableOrUnknown(
          data['processed_at']!,
          _processedAtMeta,
        ),
      );
    }
    if (data.containsKey('followed_at')) {
      context.handle(
        _followedAtMeta,
        followedAt.isAcceptableOrUnknown(data['followed_at']!, _followedAtMeta),
      );
    }
    if (data.containsKey('last_opened_at')) {
      context.handle(
        _lastOpenedAtMeta,
        lastOpenedAt.isAcceptableOrUnknown(
          data['last_opened_at']!,
          _lastOpenedAtMeta,
        ),
      );
    }
    if (data.containsKey('open_count')) {
      context.handle(
        _openCountMeta,
        openCount.isAcceptableOrUnknown(data['open_count']!, _openCountMeta),
      );
    }
    if (data.containsKey('created_at')) {
      context.handle(
        _createdAtMeta,
        createdAt.isAcceptableOrUnknown(data['created_at']!, _createdAtMeta),
      );
    } else if (isInserting) {
      context.missing(_createdAtMeta);
    }
    if (data.containsKey('updated_at')) {
      context.handle(
        _updatedAtMeta,
        updatedAt.isAcceptableOrUnknown(data['updated_at']!, _updatedAtMeta),
      );
    } else if (isInserting) {
      context.missing(_updatedAtMeta);
    }
    return context;
  }

  @override
  Set<GeneratedColumn> get $primaryKey => {id};
  @override
  List<Set<GeneratedColumn>> get uniqueKeys => [
    {platform, normalizedUsername},
  ];
  @override
  TargetAccount map(Map<String, dynamic> data, {String? tablePrefix}) {
    final effectivePrefix = tablePrefix != null ? '$tablePrefix.' : '';
    return TargetAccount(
      id: attachedDatabase.typeMapping.read(
        DriftSqlType.string,
        data['${effectivePrefix}id'],
      )!,
      platform: $TargetsTable.$converterplatform.fromSql(
        attachedDatabase.typeMapping.read(
          DriftSqlType.string,
          data['${effectivePrefix}platform'],
        )!,
      ),
      username: attachedDatabase.typeMapping.read(
        DriftSqlType.string,
        data['${effectivePrefix}username'],
      )!,
      normalizedUsername: attachedDatabase.typeMapping.read(
        DriftSqlType.string,
        data['${effectivePrefix}normalized_username'],
      )!,
      profileUrl: attachedDatabase.typeMapping.read(
        DriftSqlType.string,
        data['${effectivePrefix}profile_url'],
      )!,
      ownerId: attachedDatabase.typeMapping.read(
        DriftSqlType.string,
        data['${effectivePrefix}owner_id'],
      ),
      status: $TargetsTable.$converterstatus.fromSql(
        attachedDatabase.typeMapping.read(
          DriftSqlType.string,
          data['${effectivePrefix}status'],
        )!,
      ),
      memo: attachedDatabase.typeMapping.read(
        DriftSqlType.string,
        data['${effectivePrefix}memo'],
      )!,
      groupName: attachedDatabase.typeMapping.read(
        DriftSqlType.string,
        data['${effectivePrefix}group_name'],
      )!,
      isSample: attachedDatabase.typeMapping.read(
        DriftSqlType.bool,
        data['${effectivePrefix}is_sample'],
      )!,
      importedAt: attachedDatabase.typeMapping.read(
        DriftSqlType.dateTime,
        data['${effectivePrefix}imported_at'],
      )!,
      processedAt: attachedDatabase.typeMapping.read(
        DriftSqlType.dateTime,
        data['${effectivePrefix}processed_at'],
      ),
      followedAt: attachedDatabase.typeMapping.read(
        DriftSqlType.dateTime,
        data['${effectivePrefix}followed_at'],
      ),
      lastOpenedAt: attachedDatabase.typeMapping.read(
        DriftSqlType.dateTime,
        data['${effectivePrefix}last_opened_at'],
      ),
      openCount: attachedDatabase.typeMapping.read(
        DriftSqlType.int,
        data['${effectivePrefix}open_count'],
      )!,
      createdAt: attachedDatabase.typeMapping.read(
        DriftSqlType.dateTime,
        data['${effectivePrefix}created_at'],
      )!,
      updatedAt: attachedDatabase.typeMapping.read(
        DriftSqlType.dateTime,
        data['${effectivePrefix}updated_at'],
      )!,
    );
  }

  @override
  $TargetsTable createAlias(String alias) {
    return $TargetsTable(attachedDatabase, alias);
  }

  static JsonTypeConverter2<PlatformType, String, String> $converterplatform =
      const EnumNameConverter<PlatformType>(PlatformType.values);
  static JsonTypeConverter2<TargetStatus, String, String> $converterstatus =
      const EnumNameConverter<TargetStatus>(TargetStatus.values);
}

class TargetAccount extends DataClass implements Insertable<TargetAccount> {
  final String id;
  final PlatformType platform;
  final String username;
  final String normalizedUsername;
  final String profileUrl;
  final String? ownerId;
  final TargetStatus status;
  final String memo;
  final String groupName;
  final bool isSample;
  final DateTime importedAt;
  final DateTime? processedAt;
  final DateTime? followedAt;
  final DateTime? lastOpenedAt;
  final int openCount;
  final DateTime createdAt;
  final DateTime updatedAt;
  const TargetAccount({
    required this.id,
    required this.platform,
    required this.username,
    required this.normalizedUsername,
    required this.profileUrl,
    this.ownerId,
    required this.status,
    required this.memo,
    required this.groupName,
    required this.isSample,
    required this.importedAt,
    this.processedAt,
    this.followedAt,
    this.lastOpenedAt,
    required this.openCount,
    required this.createdAt,
    required this.updatedAt,
  });
  @override
  Map<String, Expression> toColumns(bool nullToAbsent) {
    final map = <String, Expression>{};
    map['id'] = Variable<String>(id);
    {
      map['platform'] = Variable<String>(
        $TargetsTable.$converterplatform.toSql(platform),
      );
    }
    map['username'] = Variable<String>(username);
    map['normalized_username'] = Variable<String>(normalizedUsername);
    map['profile_url'] = Variable<String>(profileUrl);
    if (!nullToAbsent || ownerId != null) {
      map['owner_id'] = Variable<String>(ownerId);
    }
    {
      map['status'] = Variable<String>(
        $TargetsTable.$converterstatus.toSql(status),
      );
    }
    map['memo'] = Variable<String>(memo);
    map['group_name'] = Variable<String>(groupName);
    map['is_sample'] = Variable<bool>(isSample);
    map['imported_at'] = Variable<DateTime>(importedAt);
    if (!nullToAbsent || processedAt != null) {
      map['processed_at'] = Variable<DateTime>(processedAt);
    }
    if (!nullToAbsent || followedAt != null) {
      map['followed_at'] = Variable<DateTime>(followedAt);
    }
    if (!nullToAbsent || lastOpenedAt != null) {
      map['last_opened_at'] = Variable<DateTime>(lastOpenedAt);
    }
    map['open_count'] = Variable<int>(openCount);
    map['created_at'] = Variable<DateTime>(createdAt);
    map['updated_at'] = Variable<DateTime>(updatedAt);
    return map;
  }

  TargetsCompanion toCompanion(bool nullToAbsent) {
    return TargetsCompanion(
      id: Value(id),
      platform: Value(platform),
      username: Value(username),
      normalizedUsername: Value(normalizedUsername),
      profileUrl: Value(profileUrl),
      ownerId: ownerId == null && nullToAbsent
          ? const Value.absent()
          : Value(ownerId),
      status: Value(status),
      memo: Value(memo),
      groupName: Value(groupName),
      isSample: Value(isSample),
      importedAt: Value(importedAt),
      processedAt: processedAt == null && nullToAbsent
          ? const Value.absent()
          : Value(processedAt),
      followedAt: followedAt == null && nullToAbsent
          ? const Value.absent()
          : Value(followedAt),
      lastOpenedAt: lastOpenedAt == null && nullToAbsent
          ? const Value.absent()
          : Value(lastOpenedAt),
      openCount: Value(openCount),
      createdAt: Value(createdAt),
      updatedAt: Value(updatedAt),
    );
  }

  factory TargetAccount.fromJson(
    Map<String, dynamic> json, {
    ValueSerializer? serializer,
  }) {
    serializer ??= driftRuntimeOptions.defaultSerializer;
    return TargetAccount(
      id: serializer.fromJson<String>(json['id']),
      platform: $TargetsTable.$converterplatform.fromJson(
        serializer.fromJson<String>(json['platform']),
      ),
      username: serializer.fromJson<String>(json['username']),
      normalizedUsername: serializer.fromJson<String>(
        json['normalizedUsername'],
      ),
      profileUrl: serializer.fromJson<String>(json['profileUrl']),
      ownerId: serializer.fromJson<String?>(json['ownerId']),
      status: $TargetsTable.$converterstatus.fromJson(
        serializer.fromJson<String>(json['status']),
      ),
      memo: serializer.fromJson<String>(json['memo']),
      groupName: serializer.fromJson<String>(json['groupName']),
      isSample: serializer.fromJson<bool>(json['isSample']),
      importedAt: serializer.fromJson<DateTime>(json['importedAt']),
      processedAt: serializer.fromJson<DateTime?>(json['processedAt']),
      followedAt: serializer.fromJson<DateTime?>(json['followedAt']),
      lastOpenedAt: serializer.fromJson<DateTime?>(json['lastOpenedAt']),
      openCount: serializer.fromJson<int>(json['openCount']),
      createdAt: serializer.fromJson<DateTime>(json['createdAt']),
      updatedAt: serializer.fromJson<DateTime>(json['updatedAt']),
    );
  }
  @override
  Map<String, dynamic> toJson({ValueSerializer? serializer}) {
    serializer ??= driftRuntimeOptions.defaultSerializer;
    return <String, dynamic>{
      'id': serializer.toJson<String>(id),
      'platform': serializer.toJson<String>(
        $TargetsTable.$converterplatform.toJson(platform),
      ),
      'username': serializer.toJson<String>(username),
      'normalizedUsername': serializer.toJson<String>(normalizedUsername),
      'profileUrl': serializer.toJson<String>(profileUrl),
      'ownerId': serializer.toJson<String?>(ownerId),
      'status': serializer.toJson<String>(
        $TargetsTable.$converterstatus.toJson(status),
      ),
      'memo': serializer.toJson<String>(memo),
      'groupName': serializer.toJson<String>(groupName),
      'isSample': serializer.toJson<bool>(isSample),
      'importedAt': serializer.toJson<DateTime>(importedAt),
      'processedAt': serializer.toJson<DateTime?>(processedAt),
      'followedAt': serializer.toJson<DateTime?>(followedAt),
      'lastOpenedAt': serializer.toJson<DateTime?>(lastOpenedAt),
      'openCount': serializer.toJson<int>(openCount),
      'createdAt': serializer.toJson<DateTime>(createdAt),
      'updatedAt': serializer.toJson<DateTime>(updatedAt),
    };
  }

  TargetAccount copyWith({
    String? id,
    PlatformType? platform,
    String? username,
    String? normalizedUsername,
    String? profileUrl,
    Value<String?> ownerId = const Value.absent(),
    TargetStatus? status,
    String? memo,
    String? groupName,
    bool? isSample,
    DateTime? importedAt,
    Value<DateTime?> processedAt = const Value.absent(),
    Value<DateTime?> followedAt = const Value.absent(),
    Value<DateTime?> lastOpenedAt = const Value.absent(),
    int? openCount,
    DateTime? createdAt,
    DateTime? updatedAt,
  }) => TargetAccount(
    id: id ?? this.id,
    platform: platform ?? this.platform,
    username: username ?? this.username,
    normalizedUsername: normalizedUsername ?? this.normalizedUsername,
    profileUrl: profileUrl ?? this.profileUrl,
    ownerId: ownerId.present ? ownerId.value : this.ownerId,
    status: status ?? this.status,
    memo: memo ?? this.memo,
    groupName: groupName ?? this.groupName,
    isSample: isSample ?? this.isSample,
    importedAt: importedAt ?? this.importedAt,
    processedAt: processedAt.present ? processedAt.value : this.processedAt,
    followedAt: followedAt.present ? followedAt.value : this.followedAt,
    lastOpenedAt: lastOpenedAt.present ? lastOpenedAt.value : this.lastOpenedAt,
    openCount: openCount ?? this.openCount,
    createdAt: createdAt ?? this.createdAt,
    updatedAt: updatedAt ?? this.updatedAt,
  );
  TargetAccount copyWithCompanion(TargetsCompanion data) {
    return TargetAccount(
      id: data.id.present ? data.id.value : this.id,
      platform: data.platform.present ? data.platform.value : this.platform,
      username: data.username.present ? data.username.value : this.username,
      normalizedUsername: data.normalizedUsername.present
          ? data.normalizedUsername.value
          : this.normalizedUsername,
      profileUrl: data.profileUrl.present
          ? data.profileUrl.value
          : this.profileUrl,
      ownerId: data.ownerId.present ? data.ownerId.value : this.ownerId,
      status: data.status.present ? data.status.value : this.status,
      memo: data.memo.present ? data.memo.value : this.memo,
      groupName: data.groupName.present ? data.groupName.value : this.groupName,
      isSample: data.isSample.present ? data.isSample.value : this.isSample,
      importedAt: data.importedAt.present
          ? data.importedAt.value
          : this.importedAt,
      processedAt: data.processedAt.present
          ? data.processedAt.value
          : this.processedAt,
      followedAt: data.followedAt.present
          ? data.followedAt.value
          : this.followedAt,
      lastOpenedAt: data.lastOpenedAt.present
          ? data.lastOpenedAt.value
          : this.lastOpenedAt,
      openCount: data.openCount.present ? data.openCount.value : this.openCount,
      createdAt: data.createdAt.present ? data.createdAt.value : this.createdAt,
      updatedAt: data.updatedAt.present ? data.updatedAt.value : this.updatedAt,
    );
  }

  @override
  String toString() {
    return (StringBuffer('TargetAccount(')
          ..write('id: $id, ')
          ..write('platform: $platform, ')
          ..write('username: $username, ')
          ..write('normalizedUsername: $normalizedUsername, ')
          ..write('profileUrl: $profileUrl, ')
          ..write('ownerId: $ownerId, ')
          ..write('status: $status, ')
          ..write('memo: $memo, ')
          ..write('groupName: $groupName, ')
          ..write('isSample: $isSample, ')
          ..write('importedAt: $importedAt, ')
          ..write('processedAt: $processedAt, ')
          ..write('followedAt: $followedAt, ')
          ..write('lastOpenedAt: $lastOpenedAt, ')
          ..write('openCount: $openCount, ')
          ..write('createdAt: $createdAt, ')
          ..write('updatedAt: $updatedAt')
          ..write(')'))
        .toString();
  }

  @override
  int get hashCode => Object.hash(
    id,
    platform,
    username,
    normalizedUsername,
    profileUrl,
    ownerId,
    status,
    memo,
    groupName,
    isSample,
    importedAt,
    processedAt,
    followedAt,
    lastOpenedAt,
    openCount,
    createdAt,
    updatedAt,
  );
  @override
  bool operator ==(Object other) =>
      identical(this, other) ||
      (other is TargetAccount &&
          other.id == this.id &&
          other.platform == this.platform &&
          other.username == this.username &&
          other.normalizedUsername == this.normalizedUsername &&
          other.profileUrl == this.profileUrl &&
          other.ownerId == this.ownerId &&
          other.status == this.status &&
          other.memo == this.memo &&
          other.groupName == this.groupName &&
          other.isSample == this.isSample &&
          other.importedAt == this.importedAt &&
          other.processedAt == this.processedAt &&
          other.followedAt == this.followedAt &&
          other.lastOpenedAt == this.lastOpenedAt &&
          other.openCount == this.openCount &&
          other.createdAt == this.createdAt &&
          other.updatedAt == this.updatedAt);
}

class TargetsCompanion extends UpdateCompanion<TargetAccount> {
  final Value<String> id;
  final Value<PlatformType> platform;
  final Value<String> username;
  final Value<String> normalizedUsername;
  final Value<String> profileUrl;
  final Value<String?> ownerId;
  final Value<TargetStatus> status;
  final Value<String> memo;
  final Value<String> groupName;
  final Value<bool> isSample;
  final Value<DateTime> importedAt;
  final Value<DateTime?> processedAt;
  final Value<DateTime?> followedAt;
  final Value<DateTime?> lastOpenedAt;
  final Value<int> openCount;
  final Value<DateTime> createdAt;
  final Value<DateTime> updatedAt;
  final Value<int> rowid;
  const TargetsCompanion({
    this.id = const Value.absent(),
    this.platform = const Value.absent(),
    this.username = const Value.absent(),
    this.normalizedUsername = const Value.absent(),
    this.profileUrl = const Value.absent(),
    this.ownerId = const Value.absent(),
    this.status = const Value.absent(),
    this.memo = const Value.absent(),
    this.groupName = const Value.absent(),
    this.isSample = const Value.absent(),
    this.importedAt = const Value.absent(),
    this.processedAt = const Value.absent(),
    this.followedAt = const Value.absent(),
    this.lastOpenedAt = const Value.absent(),
    this.openCount = const Value.absent(),
    this.createdAt = const Value.absent(),
    this.updatedAt = const Value.absent(),
    this.rowid = const Value.absent(),
  });
  TargetsCompanion.insert({
    required String id,
    required PlatformType platform,
    required String username,
    required String normalizedUsername,
    required String profileUrl,
    this.ownerId = const Value.absent(),
    this.status = const Value.absent(),
    this.memo = const Value.absent(),
    this.groupName = const Value.absent(),
    this.isSample = const Value.absent(),
    required DateTime importedAt,
    this.processedAt = const Value.absent(),
    this.followedAt = const Value.absent(),
    this.lastOpenedAt = const Value.absent(),
    this.openCount = const Value.absent(),
    required DateTime createdAt,
    required DateTime updatedAt,
    this.rowid = const Value.absent(),
  }) : id = Value(id),
       platform = Value(platform),
       username = Value(username),
       normalizedUsername = Value(normalizedUsername),
       profileUrl = Value(profileUrl),
       importedAt = Value(importedAt),
       createdAt = Value(createdAt),
       updatedAt = Value(updatedAt);
  static Insertable<TargetAccount> custom({
    Expression<String>? id,
    Expression<String>? platform,
    Expression<String>? username,
    Expression<String>? normalizedUsername,
    Expression<String>? profileUrl,
    Expression<String>? ownerId,
    Expression<String>? status,
    Expression<String>? memo,
    Expression<String>? groupName,
    Expression<bool>? isSample,
    Expression<DateTime>? importedAt,
    Expression<DateTime>? processedAt,
    Expression<DateTime>? followedAt,
    Expression<DateTime>? lastOpenedAt,
    Expression<int>? openCount,
    Expression<DateTime>? createdAt,
    Expression<DateTime>? updatedAt,
    Expression<int>? rowid,
  }) {
    return RawValuesInsertable({
      if (id != null) 'id': id,
      if (platform != null) 'platform': platform,
      if (username != null) 'username': username,
      if (normalizedUsername != null) 'normalized_username': normalizedUsername,
      if (profileUrl != null) 'profile_url': profileUrl,
      if (ownerId != null) 'owner_id': ownerId,
      if (status != null) 'status': status,
      if (memo != null) 'memo': memo,
      if (groupName != null) 'group_name': groupName,
      if (isSample != null) 'is_sample': isSample,
      if (importedAt != null) 'imported_at': importedAt,
      if (processedAt != null) 'processed_at': processedAt,
      if (followedAt != null) 'followed_at': followedAt,
      if (lastOpenedAt != null) 'last_opened_at': lastOpenedAt,
      if (openCount != null) 'open_count': openCount,
      if (createdAt != null) 'created_at': createdAt,
      if (updatedAt != null) 'updated_at': updatedAt,
      if (rowid != null) 'rowid': rowid,
    });
  }

  TargetsCompanion copyWith({
    Value<String>? id,
    Value<PlatformType>? platform,
    Value<String>? username,
    Value<String>? normalizedUsername,
    Value<String>? profileUrl,
    Value<String?>? ownerId,
    Value<TargetStatus>? status,
    Value<String>? memo,
    Value<String>? groupName,
    Value<bool>? isSample,
    Value<DateTime>? importedAt,
    Value<DateTime?>? processedAt,
    Value<DateTime?>? followedAt,
    Value<DateTime?>? lastOpenedAt,
    Value<int>? openCount,
    Value<DateTime>? createdAt,
    Value<DateTime>? updatedAt,
    Value<int>? rowid,
  }) {
    return TargetsCompanion(
      id: id ?? this.id,
      platform: platform ?? this.platform,
      username: username ?? this.username,
      normalizedUsername: normalizedUsername ?? this.normalizedUsername,
      profileUrl: profileUrl ?? this.profileUrl,
      ownerId: ownerId ?? this.ownerId,
      status: status ?? this.status,
      memo: memo ?? this.memo,
      groupName: groupName ?? this.groupName,
      isSample: isSample ?? this.isSample,
      importedAt: importedAt ?? this.importedAt,
      processedAt: processedAt ?? this.processedAt,
      followedAt: followedAt ?? this.followedAt,
      lastOpenedAt: lastOpenedAt ?? this.lastOpenedAt,
      openCount: openCount ?? this.openCount,
      createdAt: createdAt ?? this.createdAt,
      updatedAt: updatedAt ?? this.updatedAt,
      rowid: rowid ?? this.rowid,
    );
  }

  @override
  Map<String, Expression> toColumns(bool nullToAbsent) {
    final map = <String, Expression>{};
    if (id.present) {
      map['id'] = Variable<String>(id.value);
    }
    if (platform.present) {
      map['platform'] = Variable<String>(
        $TargetsTable.$converterplatform.toSql(platform.value),
      );
    }
    if (username.present) {
      map['username'] = Variable<String>(username.value);
    }
    if (normalizedUsername.present) {
      map['normalized_username'] = Variable<String>(normalizedUsername.value);
    }
    if (profileUrl.present) {
      map['profile_url'] = Variable<String>(profileUrl.value);
    }
    if (ownerId.present) {
      map['owner_id'] = Variable<String>(ownerId.value);
    }
    if (status.present) {
      map['status'] = Variable<String>(
        $TargetsTable.$converterstatus.toSql(status.value),
      );
    }
    if (memo.present) {
      map['memo'] = Variable<String>(memo.value);
    }
    if (groupName.present) {
      map['group_name'] = Variable<String>(groupName.value);
    }
    if (isSample.present) {
      map['is_sample'] = Variable<bool>(isSample.value);
    }
    if (importedAt.present) {
      map['imported_at'] = Variable<DateTime>(importedAt.value);
    }
    if (processedAt.present) {
      map['processed_at'] = Variable<DateTime>(processedAt.value);
    }
    if (followedAt.present) {
      map['followed_at'] = Variable<DateTime>(followedAt.value);
    }
    if (lastOpenedAt.present) {
      map['last_opened_at'] = Variable<DateTime>(lastOpenedAt.value);
    }
    if (openCount.present) {
      map['open_count'] = Variable<int>(openCount.value);
    }
    if (createdAt.present) {
      map['created_at'] = Variable<DateTime>(createdAt.value);
    }
    if (updatedAt.present) {
      map['updated_at'] = Variable<DateTime>(updatedAt.value);
    }
    if (rowid.present) {
      map['rowid'] = Variable<int>(rowid.value);
    }
    return map;
  }

  @override
  String toString() {
    return (StringBuffer('TargetsCompanion(')
          ..write('id: $id, ')
          ..write('platform: $platform, ')
          ..write('username: $username, ')
          ..write('normalizedUsername: $normalizedUsername, ')
          ..write('profileUrl: $profileUrl, ')
          ..write('ownerId: $ownerId, ')
          ..write('status: $status, ')
          ..write('memo: $memo, ')
          ..write('groupName: $groupName, ')
          ..write('isSample: $isSample, ')
          ..write('importedAt: $importedAt, ')
          ..write('processedAt: $processedAt, ')
          ..write('followedAt: $followedAt, ')
          ..write('lastOpenedAt: $lastOpenedAt, ')
          ..write('openCount: $openCount, ')
          ..write('createdAt: $createdAt, ')
          ..write('updatedAt: $updatedAt, ')
          ..write('rowid: $rowid')
          ..write(')'))
        .toString();
  }
}

class $ActionLogsTable extends ActionLogs
    with TableInfo<$ActionLogsTable, ActionLog> {
  @override
  final GeneratedDatabase attachedDatabase;
  final String? _alias;
  $ActionLogsTable(this.attachedDatabase, [this._alias]);
  static const VerificationMeta _idMeta = const VerificationMeta('id');
  @override
  late final GeneratedColumn<String> id = GeneratedColumn<String>(
    'id',
    aliasedName,
    false,
    type: DriftSqlType.string,
    requiredDuringInsert: true,
  );
  static const VerificationMeta _targetIdMeta = const VerificationMeta(
    'targetId',
  );
  @override
  late final GeneratedColumn<String> targetId = GeneratedColumn<String>(
    'target_id',
    aliasedName,
    false,
    type: DriftSqlType.string,
    requiredDuringInsert: true,
  );
  static const VerificationMeta _ownerIdMeta = const VerificationMeta(
    'ownerId',
  );
  @override
  late final GeneratedColumn<String> ownerId = GeneratedColumn<String>(
    'owner_id',
    aliasedName,
    false,
    type: DriftSqlType.string,
    requiredDuringInsert: true,
    defaultConstraints: GeneratedColumn.constraintIsAlways(
      'REFERENCES operating_accounts (id)',
    ),
  );
  @override
  late final GeneratedColumnWithTypeConverter<PlatformType, String> platform =
      GeneratedColumn<String>(
        'platform',
        aliasedName,
        false,
        type: DriftSqlType.string,
        requiredDuringInsert: true,
      ).withConverter<PlatformType>($ActionLogsTable.$converterplatform);
  @override
  late final GeneratedColumnWithTypeConverter<ActionType, String> actionType =
      GeneratedColumn<String>(
        'action_type',
        aliasedName,
        false,
        type: DriftSqlType.string,
        requiredDuringInsert: true,
      ).withConverter<ActionType>($ActionLogsTable.$converteractionType);
  @override
  late final GeneratedColumnWithTypeConverter<TargetStatus?, String>
  statusBefore = GeneratedColumn<String>(
    'status_before',
    aliasedName,
    true,
    type: DriftSqlType.string,
    requiredDuringInsert: false,
  ).withConverter<TargetStatus?>($ActionLogsTable.$converterstatusBeforen);
  @override
  late final GeneratedColumnWithTypeConverter<TargetStatus?, String>
  statusAfter = GeneratedColumn<String>(
    'status_after',
    aliasedName,
    true,
    type: DriftSqlType.string,
    requiredDuringInsert: false,
  ).withConverter<TargetStatus?>($ActionLogsTable.$converterstatusAftern);
  static const VerificationMeta _noteMeta = const VerificationMeta('note');
  @override
  late final GeneratedColumn<String> note = GeneratedColumn<String>(
    'note',
    aliasedName,
    false,
    type: DriftSqlType.string,
    requiredDuringInsert: false,
    defaultValue: const Constant(''),
  );
  static const VerificationMeta _occurredAtMeta = const VerificationMeta(
    'occurredAt',
  );
  @override
  late final GeneratedColumn<DateTime> occurredAt = GeneratedColumn<DateTime>(
    'occurred_at',
    aliasedName,
    false,
    type: DriftSqlType.dateTime,
    requiredDuringInsert: true,
  );
  @override
  List<GeneratedColumn> get $columns => [
    id,
    targetId,
    ownerId,
    platform,
    actionType,
    statusBefore,
    statusAfter,
    note,
    occurredAt,
  ];
  @override
  String get aliasedName => _alias ?? actualTableName;
  @override
  String get actualTableName => $name;
  static const String $name = 'action_logs';
  @override
  VerificationContext validateIntegrity(
    Insertable<ActionLog> instance, {
    bool isInserting = false,
  }) {
    final context = VerificationContext();
    final data = instance.toColumns(true);
    if (data.containsKey('id')) {
      context.handle(_idMeta, id.isAcceptableOrUnknown(data['id']!, _idMeta));
    } else if (isInserting) {
      context.missing(_idMeta);
    }
    if (data.containsKey('target_id')) {
      context.handle(
        _targetIdMeta,
        targetId.isAcceptableOrUnknown(data['target_id']!, _targetIdMeta),
      );
    } else if (isInserting) {
      context.missing(_targetIdMeta);
    }
    if (data.containsKey('owner_id')) {
      context.handle(
        _ownerIdMeta,
        ownerId.isAcceptableOrUnknown(data['owner_id']!, _ownerIdMeta),
      );
    } else if (isInserting) {
      context.missing(_ownerIdMeta);
    }
    if (data.containsKey('note')) {
      context.handle(
        _noteMeta,
        note.isAcceptableOrUnknown(data['note']!, _noteMeta),
      );
    }
    if (data.containsKey('occurred_at')) {
      context.handle(
        _occurredAtMeta,
        occurredAt.isAcceptableOrUnknown(data['occurred_at']!, _occurredAtMeta),
      );
    } else if (isInserting) {
      context.missing(_occurredAtMeta);
    }
    return context;
  }

  @override
  Set<GeneratedColumn> get $primaryKey => {id};
  @override
  ActionLog map(Map<String, dynamic> data, {String? tablePrefix}) {
    final effectivePrefix = tablePrefix != null ? '$tablePrefix.' : '';
    return ActionLog(
      id: attachedDatabase.typeMapping.read(
        DriftSqlType.string,
        data['${effectivePrefix}id'],
      )!,
      targetId: attachedDatabase.typeMapping.read(
        DriftSqlType.string,
        data['${effectivePrefix}target_id'],
      )!,
      ownerId: attachedDatabase.typeMapping.read(
        DriftSqlType.string,
        data['${effectivePrefix}owner_id'],
      )!,
      platform: $ActionLogsTable.$converterplatform.fromSql(
        attachedDatabase.typeMapping.read(
          DriftSqlType.string,
          data['${effectivePrefix}platform'],
        )!,
      ),
      actionType: $ActionLogsTable.$converteractionType.fromSql(
        attachedDatabase.typeMapping.read(
          DriftSqlType.string,
          data['${effectivePrefix}action_type'],
        )!,
      ),
      statusBefore: $ActionLogsTable.$converterstatusBeforen.fromSql(
        attachedDatabase.typeMapping.read(
          DriftSqlType.string,
          data['${effectivePrefix}status_before'],
        ),
      ),
      statusAfter: $ActionLogsTable.$converterstatusAftern.fromSql(
        attachedDatabase.typeMapping.read(
          DriftSqlType.string,
          data['${effectivePrefix}status_after'],
        ),
      ),
      note: attachedDatabase.typeMapping.read(
        DriftSqlType.string,
        data['${effectivePrefix}note'],
      )!,
      occurredAt: attachedDatabase.typeMapping.read(
        DriftSqlType.dateTime,
        data['${effectivePrefix}occurred_at'],
      )!,
    );
  }

  @override
  $ActionLogsTable createAlias(String alias) {
    return $ActionLogsTable(attachedDatabase, alias);
  }

  static JsonTypeConverter2<PlatformType, String, String> $converterplatform =
      const EnumNameConverter<PlatformType>(PlatformType.values);
  static JsonTypeConverter2<ActionType, String, String> $converteractionType =
      const EnumNameConverter<ActionType>(ActionType.values);
  static JsonTypeConverter2<TargetStatus, String, String>
  $converterstatusBefore = const EnumNameConverter<TargetStatus>(
    TargetStatus.values,
  );
  static JsonTypeConverter2<TargetStatus?, String?, String?>
  $converterstatusBeforen = JsonTypeConverter2.asNullable(
    $converterstatusBefore,
  );
  static JsonTypeConverter2<TargetStatus, String, String>
  $converterstatusAfter = const EnumNameConverter<TargetStatus>(
    TargetStatus.values,
  );
  static JsonTypeConverter2<TargetStatus?, String?, String?>
  $converterstatusAftern = JsonTypeConverter2.asNullable($converterstatusAfter);
}

class ActionLog extends DataClass implements Insertable<ActionLog> {
  final String id;
  final String targetId;
  final String ownerId;
  final PlatformType platform;
  final ActionType actionType;
  final TargetStatus? statusBefore;
  final TargetStatus? statusAfter;
  final String note;
  final DateTime occurredAt;
  const ActionLog({
    required this.id,
    required this.targetId,
    required this.ownerId,
    required this.platform,
    required this.actionType,
    this.statusBefore,
    this.statusAfter,
    required this.note,
    required this.occurredAt,
  });
  @override
  Map<String, Expression> toColumns(bool nullToAbsent) {
    final map = <String, Expression>{};
    map['id'] = Variable<String>(id);
    map['target_id'] = Variable<String>(targetId);
    map['owner_id'] = Variable<String>(ownerId);
    {
      map['platform'] = Variable<String>(
        $ActionLogsTable.$converterplatform.toSql(platform),
      );
    }
    {
      map['action_type'] = Variable<String>(
        $ActionLogsTable.$converteractionType.toSql(actionType),
      );
    }
    if (!nullToAbsent || statusBefore != null) {
      map['status_before'] = Variable<String>(
        $ActionLogsTable.$converterstatusBeforen.toSql(statusBefore),
      );
    }
    if (!nullToAbsent || statusAfter != null) {
      map['status_after'] = Variable<String>(
        $ActionLogsTable.$converterstatusAftern.toSql(statusAfter),
      );
    }
    map['note'] = Variable<String>(note);
    map['occurred_at'] = Variable<DateTime>(occurredAt);
    return map;
  }

  ActionLogsCompanion toCompanion(bool nullToAbsent) {
    return ActionLogsCompanion(
      id: Value(id),
      targetId: Value(targetId),
      ownerId: Value(ownerId),
      platform: Value(platform),
      actionType: Value(actionType),
      statusBefore: statusBefore == null && nullToAbsent
          ? const Value.absent()
          : Value(statusBefore),
      statusAfter: statusAfter == null && nullToAbsent
          ? const Value.absent()
          : Value(statusAfter),
      note: Value(note),
      occurredAt: Value(occurredAt),
    );
  }

  factory ActionLog.fromJson(
    Map<String, dynamic> json, {
    ValueSerializer? serializer,
  }) {
    serializer ??= driftRuntimeOptions.defaultSerializer;
    return ActionLog(
      id: serializer.fromJson<String>(json['id']),
      targetId: serializer.fromJson<String>(json['targetId']),
      ownerId: serializer.fromJson<String>(json['ownerId']),
      platform: $ActionLogsTable.$converterplatform.fromJson(
        serializer.fromJson<String>(json['platform']),
      ),
      actionType: $ActionLogsTable.$converteractionType.fromJson(
        serializer.fromJson<String>(json['actionType']),
      ),
      statusBefore: $ActionLogsTable.$converterstatusBeforen.fromJson(
        serializer.fromJson<String?>(json['statusBefore']),
      ),
      statusAfter: $ActionLogsTable.$converterstatusAftern.fromJson(
        serializer.fromJson<String?>(json['statusAfter']),
      ),
      note: serializer.fromJson<String>(json['note']),
      occurredAt: serializer.fromJson<DateTime>(json['occurredAt']),
    );
  }
  @override
  Map<String, dynamic> toJson({ValueSerializer? serializer}) {
    serializer ??= driftRuntimeOptions.defaultSerializer;
    return <String, dynamic>{
      'id': serializer.toJson<String>(id),
      'targetId': serializer.toJson<String>(targetId),
      'ownerId': serializer.toJson<String>(ownerId),
      'platform': serializer.toJson<String>(
        $ActionLogsTable.$converterplatform.toJson(platform),
      ),
      'actionType': serializer.toJson<String>(
        $ActionLogsTable.$converteractionType.toJson(actionType),
      ),
      'statusBefore': serializer.toJson<String?>(
        $ActionLogsTable.$converterstatusBeforen.toJson(statusBefore),
      ),
      'statusAfter': serializer.toJson<String?>(
        $ActionLogsTable.$converterstatusAftern.toJson(statusAfter),
      ),
      'note': serializer.toJson<String>(note),
      'occurredAt': serializer.toJson<DateTime>(occurredAt),
    };
  }

  ActionLog copyWith({
    String? id,
    String? targetId,
    String? ownerId,
    PlatformType? platform,
    ActionType? actionType,
    Value<TargetStatus?> statusBefore = const Value.absent(),
    Value<TargetStatus?> statusAfter = const Value.absent(),
    String? note,
    DateTime? occurredAt,
  }) => ActionLog(
    id: id ?? this.id,
    targetId: targetId ?? this.targetId,
    ownerId: ownerId ?? this.ownerId,
    platform: platform ?? this.platform,
    actionType: actionType ?? this.actionType,
    statusBefore: statusBefore.present ? statusBefore.value : this.statusBefore,
    statusAfter: statusAfter.present ? statusAfter.value : this.statusAfter,
    note: note ?? this.note,
    occurredAt: occurredAt ?? this.occurredAt,
  );
  ActionLog copyWithCompanion(ActionLogsCompanion data) {
    return ActionLog(
      id: data.id.present ? data.id.value : this.id,
      targetId: data.targetId.present ? data.targetId.value : this.targetId,
      ownerId: data.ownerId.present ? data.ownerId.value : this.ownerId,
      platform: data.platform.present ? data.platform.value : this.platform,
      actionType: data.actionType.present
          ? data.actionType.value
          : this.actionType,
      statusBefore: data.statusBefore.present
          ? data.statusBefore.value
          : this.statusBefore,
      statusAfter: data.statusAfter.present
          ? data.statusAfter.value
          : this.statusAfter,
      note: data.note.present ? data.note.value : this.note,
      occurredAt: data.occurredAt.present
          ? data.occurredAt.value
          : this.occurredAt,
    );
  }

  @override
  String toString() {
    return (StringBuffer('ActionLog(')
          ..write('id: $id, ')
          ..write('targetId: $targetId, ')
          ..write('ownerId: $ownerId, ')
          ..write('platform: $platform, ')
          ..write('actionType: $actionType, ')
          ..write('statusBefore: $statusBefore, ')
          ..write('statusAfter: $statusAfter, ')
          ..write('note: $note, ')
          ..write('occurredAt: $occurredAt')
          ..write(')'))
        .toString();
  }

  @override
  int get hashCode => Object.hash(
    id,
    targetId,
    ownerId,
    platform,
    actionType,
    statusBefore,
    statusAfter,
    note,
    occurredAt,
  );
  @override
  bool operator ==(Object other) =>
      identical(this, other) ||
      (other is ActionLog &&
          other.id == this.id &&
          other.targetId == this.targetId &&
          other.ownerId == this.ownerId &&
          other.platform == this.platform &&
          other.actionType == this.actionType &&
          other.statusBefore == this.statusBefore &&
          other.statusAfter == this.statusAfter &&
          other.note == this.note &&
          other.occurredAt == this.occurredAt);
}

class ActionLogsCompanion extends UpdateCompanion<ActionLog> {
  final Value<String> id;
  final Value<String> targetId;
  final Value<String> ownerId;
  final Value<PlatformType> platform;
  final Value<ActionType> actionType;
  final Value<TargetStatus?> statusBefore;
  final Value<TargetStatus?> statusAfter;
  final Value<String> note;
  final Value<DateTime> occurredAt;
  final Value<int> rowid;
  const ActionLogsCompanion({
    this.id = const Value.absent(),
    this.targetId = const Value.absent(),
    this.ownerId = const Value.absent(),
    this.platform = const Value.absent(),
    this.actionType = const Value.absent(),
    this.statusBefore = const Value.absent(),
    this.statusAfter = const Value.absent(),
    this.note = const Value.absent(),
    this.occurredAt = const Value.absent(),
    this.rowid = const Value.absent(),
  });
  ActionLogsCompanion.insert({
    required String id,
    required String targetId,
    required String ownerId,
    required PlatformType platform,
    required ActionType actionType,
    this.statusBefore = const Value.absent(),
    this.statusAfter = const Value.absent(),
    this.note = const Value.absent(),
    required DateTime occurredAt,
    this.rowid = const Value.absent(),
  }) : id = Value(id),
       targetId = Value(targetId),
       ownerId = Value(ownerId),
       platform = Value(platform),
       actionType = Value(actionType),
       occurredAt = Value(occurredAt);
  static Insertable<ActionLog> custom({
    Expression<String>? id,
    Expression<String>? targetId,
    Expression<String>? ownerId,
    Expression<String>? platform,
    Expression<String>? actionType,
    Expression<String>? statusBefore,
    Expression<String>? statusAfter,
    Expression<String>? note,
    Expression<DateTime>? occurredAt,
    Expression<int>? rowid,
  }) {
    return RawValuesInsertable({
      if (id != null) 'id': id,
      if (targetId != null) 'target_id': targetId,
      if (ownerId != null) 'owner_id': ownerId,
      if (platform != null) 'platform': platform,
      if (actionType != null) 'action_type': actionType,
      if (statusBefore != null) 'status_before': statusBefore,
      if (statusAfter != null) 'status_after': statusAfter,
      if (note != null) 'note': note,
      if (occurredAt != null) 'occurred_at': occurredAt,
      if (rowid != null) 'rowid': rowid,
    });
  }

  ActionLogsCompanion copyWith({
    Value<String>? id,
    Value<String>? targetId,
    Value<String>? ownerId,
    Value<PlatformType>? platform,
    Value<ActionType>? actionType,
    Value<TargetStatus?>? statusBefore,
    Value<TargetStatus?>? statusAfter,
    Value<String>? note,
    Value<DateTime>? occurredAt,
    Value<int>? rowid,
  }) {
    return ActionLogsCompanion(
      id: id ?? this.id,
      targetId: targetId ?? this.targetId,
      ownerId: ownerId ?? this.ownerId,
      platform: platform ?? this.platform,
      actionType: actionType ?? this.actionType,
      statusBefore: statusBefore ?? this.statusBefore,
      statusAfter: statusAfter ?? this.statusAfter,
      note: note ?? this.note,
      occurredAt: occurredAt ?? this.occurredAt,
      rowid: rowid ?? this.rowid,
    );
  }

  @override
  Map<String, Expression> toColumns(bool nullToAbsent) {
    final map = <String, Expression>{};
    if (id.present) {
      map['id'] = Variable<String>(id.value);
    }
    if (targetId.present) {
      map['target_id'] = Variable<String>(targetId.value);
    }
    if (ownerId.present) {
      map['owner_id'] = Variable<String>(ownerId.value);
    }
    if (platform.present) {
      map['platform'] = Variable<String>(
        $ActionLogsTable.$converterplatform.toSql(platform.value),
      );
    }
    if (actionType.present) {
      map['action_type'] = Variable<String>(
        $ActionLogsTable.$converteractionType.toSql(actionType.value),
      );
    }
    if (statusBefore.present) {
      map['status_before'] = Variable<String>(
        $ActionLogsTable.$converterstatusBeforen.toSql(statusBefore.value),
      );
    }
    if (statusAfter.present) {
      map['status_after'] = Variable<String>(
        $ActionLogsTable.$converterstatusAftern.toSql(statusAfter.value),
      );
    }
    if (note.present) {
      map['note'] = Variable<String>(note.value);
    }
    if (occurredAt.present) {
      map['occurred_at'] = Variable<DateTime>(occurredAt.value);
    }
    if (rowid.present) {
      map['rowid'] = Variable<int>(rowid.value);
    }
    return map;
  }

  @override
  String toString() {
    return (StringBuffer('ActionLogsCompanion(')
          ..write('id: $id, ')
          ..write('targetId: $targetId, ')
          ..write('ownerId: $ownerId, ')
          ..write('platform: $platform, ')
          ..write('actionType: $actionType, ')
          ..write('statusBefore: $statusBefore, ')
          ..write('statusAfter: $statusAfter, ')
          ..write('note: $note, ')
          ..write('occurredAt: $occurredAt, ')
          ..write('rowid: $rowid')
          ..write(')'))
        .toString();
  }
}

class $AppSettingsTable extends AppSettings
    with TableInfo<$AppSettingsTable, AppSetting> {
  @override
  final GeneratedDatabase attachedDatabase;
  final String? _alias;
  $AppSettingsTable(this.attachedDatabase, [this._alias]);
  static const VerificationMeta _keyMeta = const VerificationMeta('key');
  @override
  late final GeneratedColumn<String> key = GeneratedColumn<String>(
    'key',
    aliasedName,
    false,
    type: DriftSqlType.string,
    requiredDuringInsert: true,
  );
  static const VerificationMeta _valueMeta = const VerificationMeta('value');
  @override
  late final GeneratedColumn<String> value = GeneratedColumn<String>(
    'value',
    aliasedName,
    false,
    type: DriftSqlType.string,
    requiredDuringInsert: true,
  );
  @override
  List<GeneratedColumn> get $columns => [key, value];
  @override
  String get aliasedName => _alias ?? actualTableName;
  @override
  String get actualTableName => $name;
  static const String $name = 'app_settings';
  @override
  VerificationContext validateIntegrity(
    Insertable<AppSetting> instance, {
    bool isInserting = false,
  }) {
    final context = VerificationContext();
    final data = instance.toColumns(true);
    if (data.containsKey('key')) {
      context.handle(
        _keyMeta,
        key.isAcceptableOrUnknown(data['key']!, _keyMeta),
      );
    } else if (isInserting) {
      context.missing(_keyMeta);
    }
    if (data.containsKey('value')) {
      context.handle(
        _valueMeta,
        value.isAcceptableOrUnknown(data['value']!, _valueMeta),
      );
    } else if (isInserting) {
      context.missing(_valueMeta);
    }
    return context;
  }

  @override
  Set<GeneratedColumn> get $primaryKey => {key};
  @override
  AppSetting map(Map<String, dynamic> data, {String? tablePrefix}) {
    final effectivePrefix = tablePrefix != null ? '$tablePrefix.' : '';
    return AppSetting(
      key: attachedDatabase.typeMapping.read(
        DriftSqlType.string,
        data['${effectivePrefix}key'],
      )!,
      value: attachedDatabase.typeMapping.read(
        DriftSqlType.string,
        data['${effectivePrefix}value'],
      )!,
    );
  }

  @override
  $AppSettingsTable createAlias(String alias) {
    return $AppSettingsTable(attachedDatabase, alias);
  }
}

class AppSetting extends DataClass implements Insertable<AppSetting> {
  final String key;
  final String value;
  const AppSetting({required this.key, required this.value});
  @override
  Map<String, Expression> toColumns(bool nullToAbsent) {
    final map = <String, Expression>{};
    map['key'] = Variable<String>(key);
    map['value'] = Variable<String>(value);
    return map;
  }

  AppSettingsCompanion toCompanion(bool nullToAbsent) {
    return AppSettingsCompanion(key: Value(key), value: Value(value));
  }

  factory AppSetting.fromJson(
    Map<String, dynamic> json, {
    ValueSerializer? serializer,
  }) {
    serializer ??= driftRuntimeOptions.defaultSerializer;
    return AppSetting(
      key: serializer.fromJson<String>(json['key']),
      value: serializer.fromJson<String>(json['value']),
    );
  }
  @override
  Map<String, dynamic> toJson({ValueSerializer? serializer}) {
    serializer ??= driftRuntimeOptions.defaultSerializer;
    return <String, dynamic>{
      'key': serializer.toJson<String>(key),
      'value': serializer.toJson<String>(value),
    };
  }

  AppSetting copyWith({String? key, String? value}) =>
      AppSetting(key: key ?? this.key, value: value ?? this.value);
  AppSetting copyWithCompanion(AppSettingsCompanion data) {
    return AppSetting(
      key: data.key.present ? data.key.value : this.key,
      value: data.value.present ? data.value.value : this.value,
    );
  }

  @override
  String toString() {
    return (StringBuffer('AppSetting(')
          ..write('key: $key, ')
          ..write('value: $value')
          ..write(')'))
        .toString();
  }

  @override
  int get hashCode => Object.hash(key, value);
  @override
  bool operator ==(Object other) =>
      identical(this, other) ||
      (other is AppSetting &&
          other.key == this.key &&
          other.value == this.value);
}

class AppSettingsCompanion extends UpdateCompanion<AppSetting> {
  final Value<String> key;
  final Value<String> value;
  final Value<int> rowid;
  const AppSettingsCompanion({
    this.key = const Value.absent(),
    this.value = const Value.absent(),
    this.rowid = const Value.absent(),
  });
  AppSettingsCompanion.insert({
    required String key,
    required String value,
    this.rowid = const Value.absent(),
  }) : key = Value(key),
       value = Value(value);
  static Insertable<AppSetting> custom({
    Expression<String>? key,
    Expression<String>? value,
    Expression<int>? rowid,
  }) {
    return RawValuesInsertable({
      if (key != null) 'key': key,
      if (value != null) 'value': value,
      if (rowid != null) 'rowid': rowid,
    });
  }

  AppSettingsCompanion copyWith({
    Value<String>? key,
    Value<String>? value,
    Value<int>? rowid,
  }) {
    return AppSettingsCompanion(
      key: key ?? this.key,
      value: value ?? this.value,
      rowid: rowid ?? this.rowid,
    );
  }

  @override
  Map<String, Expression> toColumns(bool nullToAbsent) {
    final map = <String, Expression>{};
    if (key.present) {
      map['key'] = Variable<String>(key.value);
    }
    if (value.present) {
      map['value'] = Variable<String>(value.value);
    }
    if (rowid.present) {
      map['rowid'] = Variable<int>(rowid.value);
    }
    return map;
  }

  @override
  String toString() {
    return (StringBuffer('AppSettingsCompanion(')
          ..write('key: $key, ')
          ..write('value: $value, ')
          ..write('rowid: $rowid')
          ..write(')'))
        .toString();
  }
}

abstract class _$AppDatabase extends GeneratedDatabase {
  _$AppDatabase(QueryExecutor e) : super(e);
  $AppDatabaseManager get managers => $AppDatabaseManager(this);
  late final $OperatingAccountsTable operatingAccounts =
      $OperatingAccountsTable(this);
  late final $TargetsTable targets = $TargetsTable(this);
  late final $ActionLogsTable actionLogs = $ActionLogsTable(this);
  late final $AppSettingsTable appSettings = $AppSettingsTable(this);
  late final Index targetWork = Index(
    'target_work',
    'CREATE INDEX target_work ON targets (platform, status, imported_at, id)',
  );
  late final Index targetOwnerFollow = Index(
    'target_owner_follow',
    'CREATE INDEX target_owner_follow ON targets (owner_id, status, followed_at)',
  );
  late final Index logsOwnerTime = Index(
    'logs_owner_time',
    'CREATE INDEX logs_owner_time ON action_logs (owner_id, occurred_at)',
  );
  @override
  Iterable<TableInfo<Table, Object?>> get allTables =>
      allSchemaEntities.whereType<TableInfo<Table, Object?>>();
  @override
  List<DatabaseSchemaEntity> get allSchemaEntities => [
    operatingAccounts,
    targets,
    actionLogs,
    appSettings,
    targetWork,
    targetOwnerFollow,
    logsOwnerTime,
  ];
}

typedef $$OperatingAccountsTableCreateCompanionBuilder =
    OperatingAccountsCompanion Function({
      required String id,
      required PlatformType platform,
      required String displayName,
      Value<bool> archived,
      Value<bool> isSample,
      Value<int> cumulativeFollows,
      Value<bool> breakNoticeShown,
      required DateTime createdAt,
      Value<int> rowid,
    });
typedef $$OperatingAccountsTableUpdateCompanionBuilder =
    OperatingAccountsCompanion Function({
      Value<String> id,
      Value<PlatformType> platform,
      Value<String> displayName,
      Value<bool> archived,
      Value<bool> isSample,
      Value<int> cumulativeFollows,
      Value<bool> breakNoticeShown,
      Value<DateTime> createdAt,
      Value<int> rowid,
    });

final class $$OperatingAccountsTableReferences
    extends
        BaseReferences<
          _$AppDatabase,
          $OperatingAccountsTable,
          OperatingAccount
        > {
  $$OperatingAccountsTableReferences(
    super.$_db,
    super.$_table,
    super.$_typedResult,
  );

  static MultiTypedResultKey<$TargetsTable, List<TargetAccount>>
  _targetsRefsTable(_$AppDatabase db) => MultiTypedResultKey.fromTable(
    db.targets,
    aliasName: 'operating_accounts__id__targets__owner_id',
  );

  $$TargetsTableProcessedTableManager get targetsRefs {
    final manager = $$TargetsTableTableManager(
      $_db,
      $_db.targets,
    ).filter((f) => f.ownerId.id.sqlEquals($_itemColumn<String>('id')!));

    final cache = $_typedResult.readTableOrNull(_targetsRefsTable($_db));
    return ProcessedTableManager(
      manager.$state.copyWith(prefetchedData: cache),
    );
  }

  static MultiTypedResultKey<$ActionLogsTable, List<ActionLog>>
  _actionLogsRefsTable(_$AppDatabase db) => MultiTypedResultKey.fromTable(
    db.actionLogs,
    aliasName: 'operating_accounts__id__action_logs__owner_id',
  );

  $$ActionLogsTableProcessedTableManager get actionLogsRefs {
    final manager = $$ActionLogsTableTableManager(
      $_db,
      $_db.actionLogs,
    ).filter((f) => f.ownerId.id.sqlEquals($_itemColumn<String>('id')!));

    final cache = $_typedResult.readTableOrNull(_actionLogsRefsTable($_db));
    return ProcessedTableManager(
      manager.$state.copyWith(prefetchedData: cache),
    );
  }
}

class $$OperatingAccountsTableFilterComposer
    extends Composer<_$AppDatabase, $OperatingAccountsTable> {
  $$OperatingAccountsTableFilterComposer({
    required super.$db,
    required super.$table,
    super.joinBuilder,
    super.$addJoinBuilderToRootComposer,
    super.$removeJoinBuilderFromRootComposer,
  });
  ColumnFilters<String> get id => $composableBuilder(
    column: $table.id,
    builder: (column) => ColumnFilters(column),
  );

  ColumnWithTypeConverterFilters<PlatformType, PlatformType, String>
  get platform => $composableBuilder(
    column: $table.platform,
    builder: (column) => ColumnWithTypeConverterFilters(column),
  );

  ColumnFilters<String> get displayName => $composableBuilder(
    column: $table.displayName,
    builder: (column) => ColumnFilters(column),
  );

  ColumnFilters<bool> get archived => $composableBuilder(
    column: $table.archived,
    builder: (column) => ColumnFilters(column),
  );

  ColumnFilters<bool> get isSample => $composableBuilder(
    column: $table.isSample,
    builder: (column) => ColumnFilters(column),
  );

  ColumnFilters<int> get cumulativeFollows => $composableBuilder(
    column: $table.cumulativeFollows,
    builder: (column) => ColumnFilters(column),
  );

  ColumnFilters<bool> get breakNoticeShown => $composableBuilder(
    column: $table.breakNoticeShown,
    builder: (column) => ColumnFilters(column),
  );

  ColumnFilters<DateTime> get createdAt => $composableBuilder(
    column: $table.createdAt,
    builder: (column) => ColumnFilters(column),
  );

  Expression<bool> targetsRefs(
    Expression<bool> Function($$TargetsTableFilterComposer f) f,
  ) {
    final $$TargetsTableFilterComposer composer = $composerBuilder(
      composer: this,
      getCurrentColumn: (t) => t.id,
      referencedTable: $db.targets,
      getReferencedColumn: (t) => t.ownerId,
      builder:
          (
            joinBuilder, {
            $addJoinBuilderToRootComposer,
            $removeJoinBuilderFromRootComposer,
          }) => $$TargetsTableFilterComposer(
            $db: $db,
            $table: $db.targets,
            $addJoinBuilderToRootComposer: $addJoinBuilderToRootComposer,
            joinBuilder: joinBuilder,
            $removeJoinBuilderFromRootComposer:
                $removeJoinBuilderFromRootComposer,
          ),
    );
    return f(composer);
  }

  Expression<bool> actionLogsRefs(
    Expression<bool> Function($$ActionLogsTableFilterComposer f) f,
  ) {
    final $$ActionLogsTableFilterComposer composer = $composerBuilder(
      composer: this,
      getCurrentColumn: (t) => t.id,
      referencedTable: $db.actionLogs,
      getReferencedColumn: (t) => t.ownerId,
      builder:
          (
            joinBuilder, {
            $addJoinBuilderToRootComposer,
            $removeJoinBuilderFromRootComposer,
          }) => $$ActionLogsTableFilterComposer(
            $db: $db,
            $table: $db.actionLogs,
            $addJoinBuilderToRootComposer: $addJoinBuilderToRootComposer,
            joinBuilder: joinBuilder,
            $removeJoinBuilderFromRootComposer:
                $removeJoinBuilderFromRootComposer,
          ),
    );
    return f(composer);
  }
}

class $$OperatingAccountsTableOrderingComposer
    extends Composer<_$AppDatabase, $OperatingAccountsTable> {
  $$OperatingAccountsTableOrderingComposer({
    required super.$db,
    required super.$table,
    super.joinBuilder,
    super.$addJoinBuilderToRootComposer,
    super.$removeJoinBuilderFromRootComposer,
  });
  ColumnOrderings<String> get id => $composableBuilder(
    column: $table.id,
    builder: (column) => ColumnOrderings(column),
  );

  ColumnOrderings<String> get platform => $composableBuilder(
    column: $table.platform,
    builder: (column) => ColumnOrderings(column),
  );

  ColumnOrderings<String> get displayName => $composableBuilder(
    column: $table.displayName,
    builder: (column) => ColumnOrderings(column),
  );

  ColumnOrderings<bool> get archived => $composableBuilder(
    column: $table.archived,
    builder: (column) => ColumnOrderings(column),
  );

  ColumnOrderings<bool> get isSample => $composableBuilder(
    column: $table.isSample,
    builder: (column) => ColumnOrderings(column),
  );

  ColumnOrderings<int> get cumulativeFollows => $composableBuilder(
    column: $table.cumulativeFollows,
    builder: (column) => ColumnOrderings(column),
  );

  ColumnOrderings<bool> get breakNoticeShown => $composableBuilder(
    column: $table.breakNoticeShown,
    builder: (column) => ColumnOrderings(column),
  );

  ColumnOrderings<DateTime> get createdAt => $composableBuilder(
    column: $table.createdAt,
    builder: (column) => ColumnOrderings(column),
  );
}

class $$OperatingAccountsTableAnnotationComposer
    extends Composer<_$AppDatabase, $OperatingAccountsTable> {
  $$OperatingAccountsTableAnnotationComposer({
    required super.$db,
    required super.$table,
    super.joinBuilder,
    super.$addJoinBuilderToRootComposer,
    super.$removeJoinBuilderFromRootComposer,
  });
  GeneratedColumn<String> get id =>
      $composableBuilder(column: $table.id, builder: (column) => column);

  GeneratedColumnWithTypeConverter<PlatformType, String> get platform =>
      $composableBuilder(column: $table.platform, builder: (column) => column);

  GeneratedColumn<String> get displayName => $composableBuilder(
    column: $table.displayName,
    builder: (column) => column,
  );

  GeneratedColumn<bool> get archived =>
      $composableBuilder(column: $table.archived, builder: (column) => column);

  GeneratedColumn<bool> get isSample =>
      $composableBuilder(column: $table.isSample, builder: (column) => column);

  GeneratedColumn<int> get cumulativeFollows => $composableBuilder(
    column: $table.cumulativeFollows,
    builder: (column) => column,
  );

  GeneratedColumn<bool> get breakNoticeShown => $composableBuilder(
    column: $table.breakNoticeShown,
    builder: (column) => column,
  );

  GeneratedColumn<DateTime> get createdAt =>
      $composableBuilder(column: $table.createdAt, builder: (column) => column);

  Expression<T> targetsRefs<T extends Object>(
    Expression<T> Function($$TargetsTableAnnotationComposer a) f,
  ) {
    final $$TargetsTableAnnotationComposer composer = $composerBuilder(
      composer: this,
      getCurrentColumn: (t) => t.id,
      referencedTable: $db.targets,
      getReferencedColumn: (t) => t.ownerId,
      builder:
          (
            joinBuilder, {
            $addJoinBuilderToRootComposer,
            $removeJoinBuilderFromRootComposer,
          }) => $$TargetsTableAnnotationComposer(
            $db: $db,
            $table: $db.targets,
            $addJoinBuilderToRootComposer: $addJoinBuilderToRootComposer,
            joinBuilder: joinBuilder,
            $removeJoinBuilderFromRootComposer:
                $removeJoinBuilderFromRootComposer,
          ),
    );
    return f(composer);
  }

  Expression<T> actionLogsRefs<T extends Object>(
    Expression<T> Function($$ActionLogsTableAnnotationComposer a) f,
  ) {
    final $$ActionLogsTableAnnotationComposer composer = $composerBuilder(
      composer: this,
      getCurrentColumn: (t) => t.id,
      referencedTable: $db.actionLogs,
      getReferencedColumn: (t) => t.ownerId,
      builder:
          (
            joinBuilder, {
            $addJoinBuilderToRootComposer,
            $removeJoinBuilderFromRootComposer,
          }) => $$ActionLogsTableAnnotationComposer(
            $db: $db,
            $table: $db.actionLogs,
            $addJoinBuilderToRootComposer: $addJoinBuilderToRootComposer,
            joinBuilder: joinBuilder,
            $removeJoinBuilderFromRootComposer:
                $removeJoinBuilderFromRootComposer,
          ),
    );
    return f(composer);
  }
}

class $$OperatingAccountsTableTableManager
    extends
        RootTableManager<
          _$AppDatabase,
          $OperatingAccountsTable,
          OperatingAccount,
          $$OperatingAccountsTableFilterComposer,
          $$OperatingAccountsTableOrderingComposer,
          $$OperatingAccountsTableAnnotationComposer,
          $$OperatingAccountsTableCreateCompanionBuilder,
          $$OperatingAccountsTableUpdateCompanionBuilder,
          (OperatingAccount, $$OperatingAccountsTableReferences),
          OperatingAccount,
          PrefetchHooks Function({bool targetsRefs, bool actionLogsRefs})
        > {
  $$OperatingAccountsTableTableManager(
    _$AppDatabase db,
    $OperatingAccountsTable table,
  ) : super(
        TableManagerState(
          db: db,
          table: table,
          createFilteringComposer: () =>
              $$OperatingAccountsTableFilterComposer($db: db, $table: table),
          createOrderingComposer: () =>
              $$OperatingAccountsTableOrderingComposer($db: db, $table: table),
          createComputedFieldComposer: () =>
              $$OperatingAccountsTableAnnotationComposer(
                $db: db,
                $table: table,
              ),
          updateCompanionCallback:
              ({
                Value<String> id = const Value.absent(),
                Value<PlatformType> platform = const Value.absent(),
                Value<String> displayName = const Value.absent(),
                Value<bool> archived = const Value.absent(),
                Value<bool> isSample = const Value.absent(),
                Value<int> cumulativeFollows = const Value.absent(),
                Value<bool> breakNoticeShown = const Value.absent(),
                Value<DateTime> createdAt = const Value.absent(),
                Value<int> rowid = const Value.absent(),
              }) => OperatingAccountsCompanion(
                id: id,
                platform: platform,
                displayName: displayName,
                archived: archived,
                isSample: isSample,
                cumulativeFollows: cumulativeFollows,
                breakNoticeShown: breakNoticeShown,
                createdAt: createdAt,
                rowid: rowid,
              ),
          createCompanionCallback:
              ({
                required String id,
                required PlatformType platform,
                required String displayName,
                Value<bool> archived = const Value.absent(),
                Value<bool> isSample = const Value.absent(),
                Value<int> cumulativeFollows = const Value.absent(),
                Value<bool> breakNoticeShown = const Value.absent(),
                required DateTime createdAt,
                Value<int> rowid = const Value.absent(),
              }) => OperatingAccountsCompanion.insert(
                id: id,
                platform: platform,
                displayName: displayName,
                archived: archived,
                isSample: isSample,
                cumulativeFollows: cumulativeFollows,
                breakNoticeShown: breakNoticeShown,
                createdAt: createdAt,
                rowid: rowid,
              ),
          withReferenceMapper: (p0) => p0
              .map(
                (e) => (
                  e.readTable(table),
                  $$OperatingAccountsTableReferences(db, table, e),
                ),
              )
              .toList(),
          prefetchHooksCallback:
              ({targetsRefs = false, actionLogsRefs = false}) {
                return PrefetchHooks(
                  db: db,
                  explicitlyWatchedTables: [
                    if (targetsRefs) db.targets,
                    if (actionLogsRefs) db.actionLogs,
                  ],
                  addJoins: null,
                  getPrefetchedDataCallback: (items) async {
                    return [
                      if (targetsRefs)
                        await $_getPrefetchedData<
                          OperatingAccount,
                          $OperatingAccountsTable,
                          TargetAccount
                        >(
                          currentTable: table,
                          referencedTable: $$OperatingAccountsTableReferences
                              ._targetsRefsTable(db),
                          managerFromTypedResult: (p0) =>
                              $$OperatingAccountsTableReferences(
                                db,
                                table,
                                p0,
                              ).targetsRefs,
                          referencedItemsForCurrentItem:
                              (item, referencedItems) => referencedItems.where(
                                (e) => e.ownerId == item.id,
                              ),
                          typedResults: items,
                        ),
                      if (actionLogsRefs)
                        await $_getPrefetchedData<
                          OperatingAccount,
                          $OperatingAccountsTable,
                          ActionLog
                        >(
                          currentTable: table,
                          referencedTable: $$OperatingAccountsTableReferences
                              ._actionLogsRefsTable(db),
                          managerFromTypedResult: (p0) =>
                              $$OperatingAccountsTableReferences(
                                db,
                                table,
                                p0,
                              ).actionLogsRefs,
                          referencedItemsForCurrentItem:
                              (item, referencedItems) => referencedItems.where(
                                (e) => e.ownerId == item.id,
                              ),
                          typedResults: items,
                        ),
                    ];
                  },
                );
              },
        ),
      );
}

typedef $$OperatingAccountsTableProcessedTableManager =
    ProcessedTableManager<
      _$AppDatabase,
      $OperatingAccountsTable,
      OperatingAccount,
      $$OperatingAccountsTableFilterComposer,
      $$OperatingAccountsTableOrderingComposer,
      $$OperatingAccountsTableAnnotationComposer,
      $$OperatingAccountsTableCreateCompanionBuilder,
      $$OperatingAccountsTableUpdateCompanionBuilder,
      (OperatingAccount, $$OperatingAccountsTableReferences),
      OperatingAccount,
      PrefetchHooks Function({bool targetsRefs, bool actionLogsRefs})
    >;
typedef $$TargetsTableCreateCompanionBuilder =
    TargetsCompanion Function({
      required String id,
      required PlatformType platform,
      required String username,
      required String normalizedUsername,
      required String profileUrl,
      Value<String?> ownerId,
      Value<TargetStatus> status,
      Value<String> memo,
      Value<String> groupName,
      Value<bool> isSample,
      required DateTime importedAt,
      Value<DateTime?> processedAt,
      Value<DateTime?> followedAt,
      Value<DateTime?> lastOpenedAt,
      Value<int> openCount,
      required DateTime createdAt,
      required DateTime updatedAt,
      Value<int> rowid,
    });
typedef $$TargetsTableUpdateCompanionBuilder =
    TargetsCompanion Function({
      Value<String> id,
      Value<PlatformType> platform,
      Value<String> username,
      Value<String> normalizedUsername,
      Value<String> profileUrl,
      Value<String?> ownerId,
      Value<TargetStatus> status,
      Value<String> memo,
      Value<String> groupName,
      Value<bool> isSample,
      Value<DateTime> importedAt,
      Value<DateTime?> processedAt,
      Value<DateTime?> followedAt,
      Value<DateTime?> lastOpenedAt,
      Value<int> openCount,
      Value<DateTime> createdAt,
      Value<DateTime> updatedAt,
      Value<int> rowid,
    });

final class $$TargetsTableReferences
    extends BaseReferences<_$AppDatabase, $TargetsTable, TargetAccount> {
  $$TargetsTableReferences(super.$_db, super.$_table, super.$_typedResult);

  static $OperatingAccountsTable _ownerIdTable(_$AppDatabase db) => db
      .operatingAccounts
      .createAlias('targets__owner_id__operating_accounts__id');

  $$OperatingAccountsTableProcessedTableManager? get ownerId {
    final $_column = $_itemColumn<String>('owner_id');
    if ($_column == null) return null;
    final manager = $$OperatingAccountsTableTableManager(
      $_db,
      $_db.operatingAccounts,
    ).filter((f) => f.id.sqlEquals($_column));
    final item = $_typedResult.readTableOrNull(_ownerIdTable($_db));
    if (item == null) return manager;
    return ProcessedTableManager(
      manager.$state.copyWith(prefetchedData: [item]),
    );
  }
}

class $$TargetsTableFilterComposer
    extends Composer<_$AppDatabase, $TargetsTable> {
  $$TargetsTableFilterComposer({
    required super.$db,
    required super.$table,
    super.joinBuilder,
    super.$addJoinBuilderToRootComposer,
    super.$removeJoinBuilderFromRootComposer,
  });
  ColumnFilters<String> get id => $composableBuilder(
    column: $table.id,
    builder: (column) => ColumnFilters(column),
  );

  ColumnWithTypeConverterFilters<PlatformType, PlatformType, String>
  get platform => $composableBuilder(
    column: $table.platform,
    builder: (column) => ColumnWithTypeConverterFilters(column),
  );

  ColumnFilters<String> get username => $composableBuilder(
    column: $table.username,
    builder: (column) => ColumnFilters(column),
  );

  ColumnFilters<String> get normalizedUsername => $composableBuilder(
    column: $table.normalizedUsername,
    builder: (column) => ColumnFilters(column),
  );

  ColumnFilters<String> get profileUrl => $composableBuilder(
    column: $table.profileUrl,
    builder: (column) => ColumnFilters(column),
  );

  ColumnWithTypeConverterFilters<TargetStatus, TargetStatus, String>
  get status => $composableBuilder(
    column: $table.status,
    builder: (column) => ColumnWithTypeConverterFilters(column),
  );

  ColumnFilters<String> get memo => $composableBuilder(
    column: $table.memo,
    builder: (column) => ColumnFilters(column),
  );

  ColumnFilters<String> get groupName => $composableBuilder(
    column: $table.groupName,
    builder: (column) => ColumnFilters(column),
  );

  ColumnFilters<bool> get isSample => $composableBuilder(
    column: $table.isSample,
    builder: (column) => ColumnFilters(column),
  );

  ColumnFilters<DateTime> get importedAt => $composableBuilder(
    column: $table.importedAt,
    builder: (column) => ColumnFilters(column),
  );

  ColumnFilters<DateTime> get processedAt => $composableBuilder(
    column: $table.processedAt,
    builder: (column) => ColumnFilters(column),
  );

  ColumnFilters<DateTime> get followedAt => $composableBuilder(
    column: $table.followedAt,
    builder: (column) => ColumnFilters(column),
  );

  ColumnFilters<DateTime> get lastOpenedAt => $composableBuilder(
    column: $table.lastOpenedAt,
    builder: (column) => ColumnFilters(column),
  );

  ColumnFilters<int> get openCount => $composableBuilder(
    column: $table.openCount,
    builder: (column) => ColumnFilters(column),
  );

  ColumnFilters<DateTime> get createdAt => $composableBuilder(
    column: $table.createdAt,
    builder: (column) => ColumnFilters(column),
  );

  ColumnFilters<DateTime> get updatedAt => $composableBuilder(
    column: $table.updatedAt,
    builder: (column) => ColumnFilters(column),
  );

  $$OperatingAccountsTableFilterComposer get ownerId {
    final $$OperatingAccountsTableFilterComposer composer = $composerBuilder(
      composer: this,
      getCurrentColumn: (t) => t.ownerId,
      referencedTable: $db.operatingAccounts,
      getReferencedColumn: (t) => t.id,
      builder:
          (
            joinBuilder, {
            $addJoinBuilderToRootComposer,
            $removeJoinBuilderFromRootComposer,
          }) => $$OperatingAccountsTableFilterComposer(
            $db: $db,
            $table: $db.operatingAccounts,
            $addJoinBuilderToRootComposer: $addJoinBuilderToRootComposer,
            joinBuilder: joinBuilder,
            $removeJoinBuilderFromRootComposer:
                $removeJoinBuilderFromRootComposer,
          ),
    );
    return composer;
  }
}

class $$TargetsTableOrderingComposer
    extends Composer<_$AppDatabase, $TargetsTable> {
  $$TargetsTableOrderingComposer({
    required super.$db,
    required super.$table,
    super.joinBuilder,
    super.$addJoinBuilderToRootComposer,
    super.$removeJoinBuilderFromRootComposer,
  });
  ColumnOrderings<String> get id => $composableBuilder(
    column: $table.id,
    builder: (column) => ColumnOrderings(column),
  );

  ColumnOrderings<String> get platform => $composableBuilder(
    column: $table.platform,
    builder: (column) => ColumnOrderings(column),
  );

  ColumnOrderings<String> get username => $composableBuilder(
    column: $table.username,
    builder: (column) => ColumnOrderings(column),
  );

  ColumnOrderings<String> get normalizedUsername => $composableBuilder(
    column: $table.normalizedUsername,
    builder: (column) => ColumnOrderings(column),
  );

  ColumnOrderings<String> get profileUrl => $composableBuilder(
    column: $table.profileUrl,
    builder: (column) => ColumnOrderings(column),
  );

  ColumnOrderings<String> get status => $composableBuilder(
    column: $table.status,
    builder: (column) => ColumnOrderings(column),
  );

  ColumnOrderings<String> get memo => $composableBuilder(
    column: $table.memo,
    builder: (column) => ColumnOrderings(column),
  );

  ColumnOrderings<String> get groupName => $composableBuilder(
    column: $table.groupName,
    builder: (column) => ColumnOrderings(column),
  );

  ColumnOrderings<bool> get isSample => $composableBuilder(
    column: $table.isSample,
    builder: (column) => ColumnOrderings(column),
  );

  ColumnOrderings<DateTime> get importedAt => $composableBuilder(
    column: $table.importedAt,
    builder: (column) => ColumnOrderings(column),
  );

  ColumnOrderings<DateTime> get processedAt => $composableBuilder(
    column: $table.processedAt,
    builder: (column) => ColumnOrderings(column),
  );

  ColumnOrderings<DateTime> get followedAt => $composableBuilder(
    column: $table.followedAt,
    builder: (column) => ColumnOrderings(column),
  );

  ColumnOrderings<DateTime> get lastOpenedAt => $composableBuilder(
    column: $table.lastOpenedAt,
    builder: (column) => ColumnOrderings(column),
  );

  ColumnOrderings<int> get openCount => $composableBuilder(
    column: $table.openCount,
    builder: (column) => ColumnOrderings(column),
  );

  ColumnOrderings<DateTime> get createdAt => $composableBuilder(
    column: $table.createdAt,
    builder: (column) => ColumnOrderings(column),
  );

  ColumnOrderings<DateTime> get updatedAt => $composableBuilder(
    column: $table.updatedAt,
    builder: (column) => ColumnOrderings(column),
  );

  $$OperatingAccountsTableOrderingComposer get ownerId {
    final $$OperatingAccountsTableOrderingComposer composer = $composerBuilder(
      composer: this,
      getCurrentColumn: (t) => t.ownerId,
      referencedTable: $db.operatingAccounts,
      getReferencedColumn: (t) => t.id,
      builder:
          (
            joinBuilder, {
            $addJoinBuilderToRootComposer,
            $removeJoinBuilderFromRootComposer,
          }) => $$OperatingAccountsTableOrderingComposer(
            $db: $db,
            $table: $db.operatingAccounts,
            $addJoinBuilderToRootComposer: $addJoinBuilderToRootComposer,
            joinBuilder: joinBuilder,
            $removeJoinBuilderFromRootComposer:
                $removeJoinBuilderFromRootComposer,
          ),
    );
    return composer;
  }
}

class $$TargetsTableAnnotationComposer
    extends Composer<_$AppDatabase, $TargetsTable> {
  $$TargetsTableAnnotationComposer({
    required super.$db,
    required super.$table,
    super.joinBuilder,
    super.$addJoinBuilderToRootComposer,
    super.$removeJoinBuilderFromRootComposer,
  });
  GeneratedColumn<String> get id =>
      $composableBuilder(column: $table.id, builder: (column) => column);

  GeneratedColumnWithTypeConverter<PlatformType, String> get platform =>
      $composableBuilder(column: $table.platform, builder: (column) => column);

  GeneratedColumn<String> get username =>
      $composableBuilder(column: $table.username, builder: (column) => column);

  GeneratedColumn<String> get normalizedUsername => $composableBuilder(
    column: $table.normalizedUsername,
    builder: (column) => column,
  );

  GeneratedColumn<String> get profileUrl => $composableBuilder(
    column: $table.profileUrl,
    builder: (column) => column,
  );

  GeneratedColumnWithTypeConverter<TargetStatus, String> get status =>
      $composableBuilder(column: $table.status, builder: (column) => column);

  GeneratedColumn<String> get memo =>
      $composableBuilder(column: $table.memo, builder: (column) => column);

  GeneratedColumn<String> get groupName =>
      $composableBuilder(column: $table.groupName, builder: (column) => column);

  GeneratedColumn<bool> get isSample =>
      $composableBuilder(column: $table.isSample, builder: (column) => column);

  GeneratedColumn<DateTime> get importedAt => $composableBuilder(
    column: $table.importedAt,
    builder: (column) => column,
  );

  GeneratedColumn<DateTime> get processedAt => $composableBuilder(
    column: $table.processedAt,
    builder: (column) => column,
  );

  GeneratedColumn<DateTime> get followedAt => $composableBuilder(
    column: $table.followedAt,
    builder: (column) => column,
  );

  GeneratedColumn<DateTime> get lastOpenedAt => $composableBuilder(
    column: $table.lastOpenedAt,
    builder: (column) => column,
  );

  GeneratedColumn<int> get openCount =>
      $composableBuilder(column: $table.openCount, builder: (column) => column);

  GeneratedColumn<DateTime> get createdAt =>
      $composableBuilder(column: $table.createdAt, builder: (column) => column);

  GeneratedColumn<DateTime> get updatedAt =>
      $composableBuilder(column: $table.updatedAt, builder: (column) => column);

  $$OperatingAccountsTableAnnotationComposer get ownerId {
    final $$OperatingAccountsTableAnnotationComposer composer =
        $composerBuilder(
          composer: this,
          getCurrentColumn: (t) => t.ownerId,
          referencedTable: $db.operatingAccounts,
          getReferencedColumn: (t) => t.id,
          builder:
              (
                joinBuilder, {
                $addJoinBuilderToRootComposer,
                $removeJoinBuilderFromRootComposer,
              }) => $$OperatingAccountsTableAnnotationComposer(
                $db: $db,
                $table: $db.operatingAccounts,
                $addJoinBuilderToRootComposer: $addJoinBuilderToRootComposer,
                joinBuilder: joinBuilder,
                $removeJoinBuilderFromRootComposer:
                    $removeJoinBuilderFromRootComposer,
              ),
        );
    return composer;
  }
}

class $$TargetsTableTableManager
    extends
        RootTableManager<
          _$AppDatabase,
          $TargetsTable,
          TargetAccount,
          $$TargetsTableFilterComposer,
          $$TargetsTableOrderingComposer,
          $$TargetsTableAnnotationComposer,
          $$TargetsTableCreateCompanionBuilder,
          $$TargetsTableUpdateCompanionBuilder,
          (TargetAccount, $$TargetsTableReferences),
          TargetAccount,
          PrefetchHooks Function({bool ownerId})
        > {
  $$TargetsTableTableManager(_$AppDatabase db, $TargetsTable table)
    : super(
        TableManagerState(
          db: db,
          table: table,
          createFilteringComposer: () =>
              $$TargetsTableFilterComposer($db: db, $table: table),
          createOrderingComposer: () =>
              $$TargetsTableOrderingComposer($db: db, $table: table),
          createComputedFieldComposer: () =>
              $$TargetsTableAnnotationComposer($db: db, $table: table),
          updateCompanionCallback:
              ({
                Value<String> id = const Value.absent(),
                Value<PlatformType> platform = const Value.absent(),
                Value<String> username = const Value.absent(),
                Value<String> normalizedUsername = const Value.absent(),
                Value<String> profileUrl = const Value.absent(),
                Value<String?> ownerId = const Value.absent(),
                Value<TargetStatus> status = const Value.absent(),
                Value<String> memo = const Value.absent(),
                Value<String> groupName = const Value.absent(),
                Value<bool> isSample = const Value.absent(),
                Value<DateTime> importedAt = const Value.absent(),
                Value<DateTime?> processedAt = const Value.absent(),
                Value<DateTime?> followedAt = const Value.absent(),
                Value<DateTime?> lastOpenedAt = const Value.absent(),
                Value<int> openCount = const Value.absent(),
                Value<DateTime> createdAt = const Value.absent(),
                Value<DateTime> updatedAt = const Value.absent(),
                Value<int> rowid = const Value.absent(),
              }) => TargetsCompanion(
                id: id,
                platform: platform,
                username: username,
                normalizedUsername: normalizedUsername,
                profileUrl: profileUrl,
                ownerId: ownerId,
                status: status,
                memo: memo,
                groupName: groupName,
                isSample: isSample,
                importedAt: importedAt,
                processedAt: processedAt,
                followedAt: followedAt,
                lastOpenedAt: lastOpenedAt,
                openCount: openCount,
                createdAt: createdAt,
                updatedAt: updatedAt,
                rowid: rowid,
              ),
          createCompanionCallback:
              ({
                required String id,
                required PlatformType platform,
                required String username,
                required String normalizedUsername,
                required String profileUrl,
                Value<String?> ownerId = const Value.absent(),
                Value<TargetStatus> status = const Value.absent(),
                Value<String> memo = const Value.absent(),
                Value<String> groupName = const Value.absent(),
                Value<bool> isSample = const Value.absent(),
                required DateTime importedAt,
                Value<DateTime?> processedAt = const Value.absent(),
                Value<DateTime?> followedAt = const Value.absent(),
                Value<DateTime?> lastOpenedAt = const Value.absent(),
                Value<int> openCount = const Value.absent(),
                required DateTime createdAt,
                required DateTime updatedAt,
                Value<int> rowid = const Value.absent(),
              }) => TargetsCompanion.insert(
                id: id,
                platform: platform,
                username: username,
                normalizedUsername: normalizedUsername,
                profileUrl: profileUrl,
                ownerId: ownerId,
                status: status,
                memo: memo,
                groupName: groupName,
                isSample: isSample,
                importedAt: importedAt,
                processedAt: processedAt,
                followedAt: followedAt,
                lastOpenedAt: lastOpenedAt,
                openCount: openCount,
                createdAt: createdAt,
                updatedAt: updatedAt,
                rowid: rowid,
              ),
          withReferenceMapper: (p0) => p0
              .map(
                (e) => (
                  e.readTable(table),
                  $$TargetsTableReferences(db, table, e),
                ),
              )
              .toList(),
          prefetchHooksCallback: ({ownerId = false}) {
            return PrefetchHooks(
              db: db,
              explicitlyWatchedTables: [],
              addJoins:
                  <
                    T extends TableManagerState<
                      dynamic,
                      dynamic,
                      dynamic,
                      dynamic,
                      dynamic,
                      dynamic,
                      dynamic,
                      dynamic,
                      dynamic,
                      dynamic,
                      dynamic
                    >
                  >(state) {
                    if (ownerId) {
                      state =
                          state.withJoin(
                                currentTable: table,
                                currentColumn: table.ownerId,
                                referencedTable: $$TargetsTableReferences
                                    ._ownerIdTable(db),
                                referencedColumn: $$TargetsTableReferences
                                    ._ownerIdTable(db)
                                    .id,
                              )
                              as T;
                    }

                    return state;
                  },
              getPrefetchedDataCallback: (items) async {
                return [];
              },
            );
          },
        ),
      );
}

typedef $$TargetsTableProcessedTableManager =
    ProcessedTableManager<
      _$AppDatabase,
      $TargetsTable,
      TargetAccount,
      $$TargetsTableFilterComposer,
      $$TargetsTableOrderingComposer,
      $$TargetsTableAnnotationComposer,
      $$TargetsTableCreateCompanionBuilder,
      $$TargetsTableUpdateCompanionBuilder,
      (TargetAccount, $$TargetsTableReferences),
      TargetAccount,
      PrefetchHooks Function({bool ownerId})
    >;
typedef $$ActionLogsTableCreateCompanionBuilder =
    ActionLogsCompanion Function({
      required String id,
      required String targetId,
      required String ownerId,
      required PlatformType platform,
      required ActionType actionType,
      Value<TargetStatus?> statusBefore,
      Value<TargetStatus?> statusAfter,
      Value<String> note,
      required DateTime occurredAt,
      Value<int> rowid,
    });
typedef $$ActionLogsTableUpdateCompanionBuilder =
    ActionLogsCompanion Function({
      Value<String> id,
      Value<String> targetId,
      Value<String> ownerId,
      Value<PlatformType> platform,
      Value<ActionType> actionType,
      Value<TargetStatus?> statusBefore,
      Value<TargetStatus?> statusAfter,
      Value<String> note,
      Value<DateTime> occurredAt,
      Value<int> rowid,
    });

final class $$ActionLogsTableReferences
    extends BaseReferences<_$AppDatabase, $ActionLogsTable, ActionLog> {
  $$ActionLogsTableReferences(super.$_db, super.$_table, super.$_typedResult);

  static $OperatingAccountsTable _ownerIdTable(_$AppDatabase db) => db
      .operatingAccounts
      .createAlias('action_logs__owner_id__operating_accounts__id');

  $$OperatingAccountsTableProcessedTableManager get ownerId {
    final $_column = $_itemColumn<String>('owner_id')!;

    final manager = $$OperatingAccountsTableTableManager(
      $_db,
      $_db.operatingAccounts,
    ).filter((f) => f.id.sqlEquals($_column));
    final item = $_typedResult.readTableOrNull(_ownerIdTable($_db));
    if (item == null) return manager;
    return ProcessedTableManager(
      manager.$state.copyWith(prefetchedData: [item]),
    );
  }
}

class $$ActionLogsTableFilterComposer
    extends Composer<_$AppDatabase, $ActionLogsTable> {
  $$ActionLogsTableFilterComposer({
    required super.$db,
    required super.$table,
    super.joinBuilder,
    super.$addJoinBuilderToRootComposer,
    super.$removeJoinBuilderFromRootComposer,
  });
  ColumnFilters<String> get id => $composableBuilder(
    column: $table.id,
    builder: (column) => ColumnFilters(column),
  );

  ColumnFilters<String> get targetId => $composableBuilder(
    column: $table.targetId,
    builder: (column) => ColumnFilters(column),
  );

  ColumnWithTypeConverterFilters<PlatformType, PlatformType, String>
  get platform => $composableBuilder(
    column: $table.platform,
    builder: (column) => ColumnWithTypeConverterFilters(column),
  );

  ColumnWithTypeConverterFilters<ActionType, ActionType, String>
  get actionType => $composableBuilder(
    column: $table.actionType,
    builder: (column) => ColumnWithTypeConverterFilters(column),
  );

  ColumnWithTypeConverterFilters<TargetStatus?, TargetStatus, String>
  get statusBefore => $composableBuilder(
    column: $table.statusBefore,
    builder: (column) => ColumnWithTypeConverterFilters(column),
  );

  ColumnWithTypeConverterFilters<TargetStatus?, TargetStatus, String>
  get statusAfter => $composableBuilder(
    column: $table.statusAfter,
    builder: (column) => ColumnWithTypeConverterFilters(column),
  );

  ColumnFilters<String> get note => $composableBuilder(
    column: $table.note,
    builder: (column) => ColumnFilters(column),
  );

  ColumnFilters<DateTime> get occurredAt => $composableBuilder(
    column: $table.occurredAt,
    builder: (column) => ColumnFilters(column),
  );

  $$OperatingAccountsTableFilterComposer get ownerId {
    final $$OperatingAccountsTableFilterComposer composer = $composerBuilder(
      composer: this,
      getCurrentColumn: (t) => t.ownerId,
      referencedTable: $db.operatingAccounts,
      getReferencedColumn: (t) => t.id,
      builder:
          (
            joinBuilder, {
            $addJoinBuilderToRootComposer,
            $removeJoinBuilderFromRootComposer,
          }) => $$OperatingAccountsTableFilterComposer(
            $db: $db,
            $table: $db.operatingAccounts,
            $addJoinBuilderToRootComposer: $addJoinBuilderToRootComposer,
            joinBuilder: joinBuilder,
            $removeJoinBuilderFromRootComposer:
                $removeJoinBuilderFromRootComposer,
          ),
    );
    return composer;
  }
}

class $$ActionLogsTableOrderingComposer
    extends Composer<_$AppDatabase, $ActionLogsTable> {
  $$ActionLogsTableOrderingComposer({
    required super.$db,
    required super.$table,
    super.joinBuilder,
    super.$addJoinBuilderToRootComposer,
    super.$removeJoinBuilderFromRootComposer,
  });
  ColumnOrderings<String> get id => $composableBuilder(
    column: $table.id,
    builder: (column) => ColumnOrderings(column),
  );

  ColumnOrderings<String> get targetId => $composableBuilder(
    column: $table.targetId,
    builder: (column) => ColumnOrderings(column),
  );

  ColumnOrderings<String> get platform => $composableBuilder(
    column: $table.platform,
    builder: (column) => ColumnOrderings(column),
  );

  ColumnOrderings<String> get actionType => $composableBuilder(
    column: $table.actionType,
    builder: (column) => ColumnOrderings(column),
  );

  ColumnOrderings<String> get statusBefore => $composableBuilder(
    column: $table.statusBefore,
    builder: (column) => ColumnOrderings(column),
  );

  ColumnOrderings<String> get statusAfter => $composableBuilder(
    column: $table.statusAfter,
    builder: (column) => ColumnOrderings(column),
  );

  ColumnOrderings<String> get note => $composableBuilder(
    column: $table.note,
    builder: (column) => ColumnOrderings(column),
  );

  ColumnOrderings<DateTime> get occurredAt => $composableBuilder(
    column: $table.occurredAt,
    builder: (column) => ColumnOrderings(column),
  );

  $$OperatingAccountsTableOrderingComposer get ownerId {
    final $$OperatingAccountsTableOrderingComposer composer = $composerBuilder(
      composer: this,
      getCurrentColumn: (t) => t.ownerId,
      referencedTable: $db.operatingAccounts,
      getReferencedColumn: (t) => t.id,
      builder:
          (
            joinBuilder, {
            $addJoinBuilderToRootComposer,
            $removeJoinBuilderFromRootComposer,
          }) => $$OperatingAccountsTableOrderingComposer(
            $db: $db,
            $table: $db.operatingAccounts,
            $addJoinBuilderToRootComposer: $addJoinBuilderToRootComposer,
            joinBuilder: joinBuilder,
            $removeJoinBuilderFromRootComposer:
                $removeJoinBuilderFromRootComposer,
          ),
    );
    return composer;
  }
}

class $$ActionLogsTableAnnotationComposer
    extends Composer<_$AppDatabase, $ActionLogsTable> {
  $$ActionLogsTableAnnotationComposer({
    required super.$db,
    required super.$table,
    super.joinBuilder,
    super.$addJoinBuilderToRootComposer,
    super.$removeJoinBuilderFromRootComposer,
  });
  GeneratedColumn<String> get id =>
      $composableBuilder(column: $table.id, builder: (column) => column);

  GeneratedColumn<String> get targetId =>
      $composableBuilder(column: $table.targetId, builder: (column) => column);

  GeneratedColumnWithTypeConverter<PlatformType, String> get platform =>
      $composableBuilder(column: $table.platform, builder: (column) => column);

  GeneratedColumnWithTypeConverter<ActionType, String> get actionType =>
      $composableBuilder(
        column: $table.actionType,
        builder: (column) => column,
      );

  GeneratedColumnWithTypeConverter<TargetStatus?, String> get statusBefore =>
      $composableBuilder(
        column: $table.statusBefore,
        builder: (column) => column,
      );

  GeneratedColumnWithTypeConverter<TargetStatus?, String> get statusAfter =>
      $composableBuilder(
        column: $table.statusAfter,
        builder: (column) => column,
      );

  GeneratedColumn<String> get note =>
      $composableBuilder(column: $table.note, builder: (column) => column);

  GeneratedColumn<DateTime> get occurredAt => $composableBuilder(
    column: $table.occurredAt,
    builder: (column) => column,
  );

  $$OperatingAccountsTableAnnotationComposer get ownerId {
    final $$OperatingAccountsTableAnnotationComposer composer =
        $composerBuilder(
          composer: this,
          getCurrentColumn: (t) => t.ownerId,
          referencedTable: $db.operatingAccounts,
          getReferencedColumn: (t) => t.id,
          builder:
              (
                joinBuilder, {
                $addJoinBuilderToRootComposer,
                $removeJoinBuilderFromRootComposer,
              }) => $$OperatingAccountsTableAnnotationComposer(
                $db: $db,
                $table: $db.operatingAccounts,
                $addJoinBuilderToRootComposer: $addJoinBuilderToRootComposer,
                joinBuilder: joinBuilder,
                $removeJoinBuilderFromRootComposer:
                    $removeJoinBuilderFromRootComposer,
              ),
        );
    return composer;
  }
}

class $$ActionLogsTableTableManager
    extends
        RootTableManager<
          _$AppDatabase,
          $ActionLogsTable,
          ActionLog,
          $$ActionLogsTableFilterComposer,
          $$ActionLogsTableOrderingComposer,
          $$ActionLogsTableAnnotationComposer,
          $$ActionLogsTableCreateCompanionBuilder,
          $$ActionLogsTableUpdateCompanionBuilder,
          (ActionLog, $$ActionLogsTableReferences),
          ActionLog,
          PrefetchHooks Function({bool ownerId})
        > {
  $$ActionLogsTableTableManager(_$AppDatabase db, $ActionLogsTable table)
    : super(
        TableManagerState(
          db: db,
          table: table,
          createFilteringComposer: () =>
              $$ActionLogsTableFilterComposer($db: db, $table: table),
          createOrderingComposer: () =>
              $$ActionLogsTableOrderingComposer($db: db, $table: table),
          createComputedFieldComposer: () =>
              $$ActionLogsTableAnnotationComposer($db: db, $table: table),
          updateCompanionCallback:
              ({
                Value<String> id = const Value.absent(),
                Value<String> targetId = const Value.absent(),
                Value<String> ownerId = const Value.absent(),
                Value<PlatformType> platform = const Value.absent(),
                Value<ActionType> actionType = const Value.absent(),
                Value<TargetStatus?> statusBefore = const Value.absent(),
                Value<TargetStatus?> statusAfter = const Value.absent(),
                Value<String> note = const Value.absent(),
                Value<DateTime> occurredAt = const Value.absent(),
                Value<int> rowid = const Value.absent(),
              }) => ActionLogsCompanion(
                id: id,
                targetId: targetId,
                ownerId: ownerId,
                platform: platform,
                actionType: actionType,
                statusBefore: statusBefore,
                statusAfter: statusAfter,
                note: note,
                occurredAt: occurredAt,
                rowid: rowid,
              ),
          createCompanionCallback:
              ({
                required String id,
                required String targetId,
                required String ownerId,
                required PlatformType platform,
                required ActionType actionType,
                Value<TargetStatus?> statusBefore = const Value.absent(),
                Value<TargetStatus?> statusAfter = const Value.absent(),
                Value<String> note = const Value.absent(),
                required DateTime occurredAt,
                Value<int> rowid = const Value.absent(),
              }) => ActionLogsCompanion.insert(
                id: id,
                targetId: targetId,
                ownerId: ownerId,
                platform: platform,
                actionType: actionType,
                statusBefore: statusBefore,
                statusAfter: statusAfter,
                note: note,
                occurredAt: occurredAt,
                rowid: rowid,
              ),
          withReferenceMapper: (p0) => p0
              .map(
                (e) => (
                  e.readTable(table),
                  $$ActionLogsTableReferences(db, table, e),
                ),
              )
              .toList(),
          prefetchHooksCallback: ({ownerId = false}) {
            return PrefetchHooks(
              db: db,
              explicitlyWatchedTables: [],
              addJoins:
                  <
                    T extends TableManagerState<
                      dynamic,
                      dynamic,
                      dynamic,
                      dynamic,
                      dynamic,
                      dynamic,
                      dynamic,
                      dynamic,
                      dynamic,
                      dynamic,
                      dynamic
                    >
                  >(state) {
                    if (ownerId) {
                      state =
                          state.withJoin(
                                currentTable: table,
                                currentColumn: table.ownerId,
                                referencedTable: $$ActionLogsTableReferences
                                    ._ownerIdTable(db),
                                referencedColumn: $$ActionLogsTableReferences
                                    ._ownerIdTable(db)
                                    .id,
                              )
                              as T;
                    }

                    return state;
                  },
              getPrefetchedDataCallback: (items) async {
                return [];
              },
            );
          },
        ),
      );
}

typedef $$ActionLogsTableProcessedTableManager =
    ProcessedTableManager<
      _$AppDatabase,
      $ActionLogsTable,
      ActionLog,
      $$ActionLogsTableFilterComposer,
      $$ActionLogsTableOrderingComposer,
      $$ActionLogsTableAnnotationComposer,
      $$ActionLogsTableCreateCompanionBuilder,
      $$ActionLogsTableUpdateCompanionBuilder,
      (ActionLog, $$ActionLogsTableReferences),
      ActionLog,
      PrefetchHooks Function({bool ownerId})
    >;
typedef $$AppSettingsTableCreateCompanionBuilder =
    AppSettingsCompanion Function({
      required String key,
      required String value,
      Value<int> rowid,
    });
typedef $$AppSettingsTableUpdateCompanionBuilder =
    AppSettingsCompanion Function({
      Value<String> key,
      Value<String> value,
      Value<int> rowid,
    });

class $$AppSettingsTableFilterComposer
    extends Composer<_$AppDatabase, $AppSettingsTable> {
  $$AppSettingsTableFilterComposer({
    required super.$db,
    required super.$table,
    super.joinBuilder,
    super.$addJoinBuilderToRootComposer,
    super.$removeJoinBuilderFromRootComposer,
  });
  ColumnFilters<String> get key => $composableBuilder(
    column: $table.key,
    builder: (column) => ColumnFilters(column),
  );

  ColumnFilters<String> get value => $composableBuilder(
    column: $table.value,
    builder: (column) => ColumnFilters(column),
  );
}

class $$AppSettingsTableOrderingComposer
    extends Composer<_$AppDatabase, $AppSettingsTable> {
  $$AppSettingsTableOrderingComposer({
    required super.$db,
    required super.$table,
    super.joinBuilder,
    super.$addJoinBuilderToRootComposer,
    super.$removeJoinBuilderFromRootComposer,
  });
  ColumnOrderings<String> get key => $composableBuilder(
    column: $table.key,
    builder: (column) => ColumnOrderings(column),
  );

  ColumnOrderings<String> get value => $composableBuilder(
    column: $table.value,
    builder: (column) => ColumnOrderings(column),
  );
}

class $$AppSettingsTableAnnotationComposer
    extends Composer<_$AppDatabase, $AppSettingsTable> {
  $$AppSettingsTableAnnotationComposer({
    required super.$db,
    required super.$table,
    super.joinBuilder,
    super.$addJoinBuilderToRootComposer,
    super.$removeJoinBuilderFromRootComposer,
  });
  GeneratedColumn<String> get key =>
      $composableBuilder(column: $table.key, builder: (column) => column);

  GeneratedColumn<String> get value =>
      $composableBuilder(column: $table.value, builder: (column) => column);
}

class $$AppSettingsTableTableManager
    extends
        RootTableManager<
          _$AppDatabase,
          $AppSettingsTable,
          AppSetting,
          $$AppSettingsTableFilterComposer,
          $$AppSettingsTableOrderingComposer,
          $$AppSettingsTableAnnotationComposer,
          $$AppSettingsTableCreateCompanionBuilder,
          $$AppSettingsTableUpdateCompanionBuilder,
          (
            AppSetting,
            BaseReferences<_$AppDatabase, $AppSettingsTable, AppSetting>,
          ),
          AppSetting,
          PrefetchHooks Function()
        > {
  $$AppSettingsTableTableManager(_$AppDatabase db, $AppSettingsTable table)
    : super(
        TableManagerState(
          db: db,
          table: table,
          createFilteringComposer: () =>
              $$AppSettingsTableFilterComposer($db: db, $table: table),
          createOrderingComposer: () =>
              $$AppSettingsTableOrderingComposer($db: db, $table: table),
          createComputedFieldComposer: () =>
              $$AppSettingsTableAnnotationComposer($db: db, $table: table),
          updateCompanionCallback:
              ({
                Value<String> key = const Value.absent(),
                Value<String> value = const Value.absent(),
                Value<int> rowid = const Value.absent(),
              }) => AppSettingsCompanion(key: key, value: value, rowid: rowid),
          createCompanionCallback:
              ({
                required String key,
                required String value,
                Value<int> rowid = const Value.absent(),
              }) => AppSettingsCompanion.insert(
                key: key,
                value: value,
                rowid: rowid,
              ),
          withReferenceMapper: (p0) => p0
              .map((e) => (e.readTable(table), BaseReferences(db, table, e)))
              .toList(),
          prefetchHooksCallback: null,
        ),
      );
}

typedef $$AppSettingsTableProcessedTableManager =
    ProcessedTableManager<
      _$AppDatabase,
      $AppSettingsTable,
      AppSetting,
      $$AppSettingsTableFilterComposer,
      $$AppSettingsTableOrderingComposer,
      $$AppSettingsTableAnnotationComposer,
      $$AppSettingsTableCreateCompanionBuilder,
      $$AppSettingsTableUpdateCompanionBuilder,
      (
        AppSetting,
        BaseReferences<_$AppDatabase, $AppSettingsTable, AppSetting>,
      ),
      AppSetting,
      PrefetchHooks Function()
    >;

class $AppDatabaseManager {
  final _$AppDatabase _db;
  $AppDatabaseManager(this._db);
  $$OperatingAccountsTableTableManager get operatingAccounts =>
      $$OperatingAccountsTableTableManager(_db, _db.operatingAccounts);
  $$TargetsTableTableManager get targets =>
      $$TargetsTableTableManager(_db, _db.targets);
  $$ActionLogsTableTableManager get actionLogs =>
      $$ActionLogsTableTableManager(_db, _db.actionLogs);
  $$AppSettingsTableTableManager get appSettings =>
      $$AppSettingsTableTableManager(_db, _db.appSettings);
}
