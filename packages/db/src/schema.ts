import {
  pgEnum,
  pgTable,
  uuid,
  varchar,
  timestamp,
  numeric,
  boolean,
  unique,
} from "drizzle-orm/pg-core";

export const accountTypeEnum = pgEnum("account_type", [
  "checking",
  "savings",
  "cash",
  "credit_card",
  "investment",
]);

export const users = pgTable("users", {
  id: uuid("id").defaultRandom().primaryKey(),

  email: varchar("email", {
    length: 255,
  })
    .notNull()
    .unique(),

  name: varchar("name", {
    length: 100,
  }),

  passwordHash: varchar("password_hash", {
    length: 255,
  }).notNull(),

  createdAt: timestamp("created_at", {
    withTimezone: true,
  })
    .defaultNow()
    .notNull(),
});

export const accounts = pgTable("accounts", {
  id: uuid("id").defaultRandom().primaryKey(),

  userId: uuid("user_id")
    .notNull()
    .references(() => users.id, {
      onDelete: "cascade",
    }),

  name: varchar("name", {
    length: 100,
  }).notNull(),

  type: accountTypeEnum("type").notNull(),

  currency: varchar("currency", {
    length: 3,
  })
    .notNull()
    .default("INR"),

  initialBalance: numeric("initial_balance", {
    precision: 15,
    scale: 2,
  })
    .notNull()
    .default("0"),

  isActive: boolean("is_active")
    .notNull()
    .default(true),

  createdAt: timestamp("created_at", {
    withTimezone: true,
  })
    .defaultNow()
    .notNull(),
});

export const transactionTypeEnum = pgEnum("transaction_type", [
  "income",
  "expense",
]);

export const categoryTypeEnum = pgEnum("category_type", [
  "income",
  "expense",
]);

export const transactionLinkTypeEnum = pgEnum("transaction_link_type", [
  "credit_card",
  "loan",
  "insurance",
]);

export const categories = pgTable("categories", {
  id: uuid("id").defaultRandom().primaryKey(),

  userId: uuid("user_id")
    .notNull()
    .references(() => users.id, {
      onDelete: "cascade",
    }),

  name: varchar("name", {
    length: 100,
  }).notNull(),

  type: categoryTypeEnum("type").notNull(),

  createdAt: timestamp("created_at", {
    withTimezone: true,
  })
    .defaultNow()
    .notNull(),
});

export const transactions = pgTable("transactions", {
  id: uuid("id").defaultRandom().primaryKey(),

  userId: uuid("user_id")
    .notNull()
    .references(() => users.id, {
      onDelete: "cascade",
    }),

  accountId: uuid("account_id")
    .notNull()
    .references(() => accounts.id, {
      onDelete: "cascade",
    }),

  categoryId: uuid("category_id")
    .notNull()
    .references(() => categories.id, {
      onDelete: "restrict",
    }),

  amount: numeric("amount", {
    precision: 15,
    scale: 2,
  }).notNull(),

  type: transactionTypeEnum("type").notNull(),

  description: varchar("description", {
    length: 255,
  }),

  transactionDate: timestamp("transaction_date", {
    withTimezone: true,
  }).notNull(),

  linkedType: transactionLinkTypeEnum("linked_type"),

  linkedId: uuid("linked_id"),

  createdAt: timestamp("created_at", {
    withTimezone: true,
  })
    .defaultNow()
    .notNull(),
});

export const goals = pgTable("goals", {
  id: uuid("id").defaultRandom().primaryKey(),

  userId: uuid("user_id")
    .notNull()
    .references(() => users.id, {
      onDelete: "cascade",
    }),

  name: varchar("name", {
    length: 100,
  }).notNull(),

  description: varchar("description", {
    length: 255,
  }),

  targetAmount: numeric("target_amount", {
    precision: 15,
    scale: 2,
  }).notNull(),

  targetDate: timestamp("target_date", {
    withTimezone: true,
  }),

  isCompleted: boolean("is_completed")
    .notNull()
    .default(false),

  createdAt: timestamp("created_at", {
    withTimezone: true,
  })
    .defaultNow()
    .notNull(),
});

export const goalContributions = pgTable("goal_contributions", {
  id: uuid("id").defaultRandom().primaryKey(),

  userId: uuid("user_id")
    .notNull()
    .references(() => users.id, {
      onDelete: "cascade",
    }),

  goalId: uuid("goal_id")
    .notNull()
    .references(() => goals.id, {
      onDelete: "cascade",
    }),

  amount: numeric("amount", {
    precision: 15,
    scale: 2,
  }).notNull(),

  contributionDate: timestamp("contribution_date", {
    withTimezone: true,
  }).notNull(),

  note: varchar("note", {
    length: 255,
  }),

  createdAt: timestamp("created_at", {
    withTimezone: true,
  })
    .defaultNow()
    .notNull(),
});

export const budgets = pgTable(
  "budgets",
  {
    id: uuid("id").defaultRandom().primaryKey(),

    userId: uuid("user_id")
      .notNull()
      .references(() => users.id, {
        onDelete: "cascade",
      }),

    categoryId: uuid("category_id")
      .notNull()
      .references(() => categories.id, {
        onDelete: "cascade",
      }),

    amount: numeric("amount", {
      precision: 15,
      scale: 2,
    }).notNull(),

    month: timestamp("month", {
      withTimezone: true,
    }).notNull(),

    createdAt: timestamp("created_at", {
      withTimezone: true,
    })
      .defaultNow()
      .notNull(),
  },
  (table) => ({
    userCategoryMonthUnique: unique(
      "budgets_user_category_month_unique"
    ).on(table.userId, table.categoryId, table.month),
  })
);

export const themeEnum = pgEnum("theme_enum", ["light", "dark", "system"]);
export const accentEnum = pgEnum("accent_enum", [
  "green",
  "blue",
  "purple",
  "rose",
  "amber",
  "mono",
]);

export const userPreferences = pgTable("user_preferences", {
  id: uuid("id").defaultRandom().primaryKey(),

  userId: uuid("user_id")
    .notNull()
    .references(() => users.id, {
      onDelete: "cascade",
    })
    .unique(),

  theme: themeEnum("theme").notNull().default("system"),

  accent: accentEnum("accent").notNull().default("green"),

  updatedAt: timestamp("updated_at", {
    withTimezone: true,
  })
    .defaultNow()
    .notNull(),
});

export const cardStatusEnum = pgEnum("card_status_enum", [
  "active",
  "inactive",
  "blocked",
]);

export const creditCards = pgTable("credit_cards", {
  id: uuid("id").defaultRandom().primaryKey(),

  userId: uuid("user_id")
    .notNull()
    .references(() => users.id, {
      onDelete: "cascade",
    }),

  accountId: uuid("account_id").references(() => accounts.id, {
    onDelete: "set null",
  }),

  cardName: varchar("card_name", { length: 100 }).notNull(),
  bankIssuer: varchar("bank_issuer", { length: 100 }).notNull(),
  cardType: varchar("card_type", { length: 50 }).notNull().default("Visa"),
  last4: varchar("last4", { length: 4 }).notNull(),

  creditLimit: numeric("credit_limit", {
    precision: 15,
    scale: 2,
  }).notNull(),

  currentOutstanding: numeric("current_outstanding", {
    precision: 15,
    scale: 2,
  })
    .notNull()
    .default("0"),

  statementDate: varchar("statement_date", { length: 2 }).notNull().default("1"),
  paymentDueDate: varchar("payment_due_date", { length: 2 }).notNull().default("15"),

  interestRate: numeric("interest_rate", {
    precision: 5,
    scale: 2,
  })
    .notNull()
    .default("18.50"),

  annualFee: numeric("annual_fee", {
    precision: 15,
    scale: 2,
  })
    .notNull()
    .default("0"),

  cardStatus: cardStatusEnum("card_status").notNull().default("active"),

  createdAt: timestamp("created_at", {
    withTimezone: true,
  })
    .defaultNow()
    .notNull(),
});

export const loanTypeEnum = pgEnum("loan_type_enum", [
  "personal",
  "home",
  "vehicle",
  "education",
  "other",
]);

export const loans = pgTable("loans", {
  id: uuid("id").defaultRandom().primaryKey(),

  userId: uuid("user_id")
    .notNull()
    .references(() => users.id, {
      onDelete: "cascade",
    }),

  lender: varchar("lender", { length: 100 }).notNull(),
  loanType: loanTypeEnum("loan_type").notNull().default("personal"),

  originalPrincipal: numeric("original_principal", {
    precision: 15,
    scale: 2,
  }).notNull(),

  currentOutstanding: numeric("current_outstanding", {
    precision: 15,
    scale: 2,
  }).notNull(),

  interestRate: numeric("interest_rate", {
    precision: 5,
    scale: 2,
  }).notNull(),

  emi: numeric("emi", {
    precision: 15,
    scale: 2,
  }).notNull(),

  startDate: timestamp("start_date", { withTimezone: true }).notNull(),
  endDate: timestamp("end_date", { withTimezone: true }),
  paymentFrequency: varchar("payment_frequency", { length: 20 }).notNull().default("monthly"),

  createdAt: timestamp("created_at", {
    withTimezone: true,
  })
    .defaultNow()
    .notNull(),
});

export const policyTypeEnum = pgEnum("policy_type_enum", [
  "health",
  "life",
  "vehicle",
  "home",
  "travel",
  "other",
]);

export const insurancePolicies = pgTable("insurance_policies", {
  id: uuid("id").defaultRandom().primaryKey(),

  userId: uuid("user_id")
    .notNull()
    .references(() => users.id, {
      onDelete: "cascade",
    }),

  provider: varchar("provider", { length: 100 }).notNull(),
  policyNumber: varchar("policy_number", { length: 100 }).notNull(),
  policyType: policyTypeEnum("policy_type").notNull().default("health"),

  coverageAmount: numeric("coverage_amount", {
    precision: 15,
    scale: 2,
  }).notNull(),

  premium: numeric("premium", {
    precision: 15,
    scale: 2,
  }).notNull(),

  premiumFrequency: varchar("premium_frequency", { length: 20 }).notNull().default("annual"),

  startDate: timestamp("start_date", { withTimezone: true }).notNull(),
  renewalDate: timestamp("renewal_date", { withTimezone: true }).notNull(),

  nominee: varchar("nominee", { length: 100 }),
  notes: varchar("notes", { length: 255 }),

  createdAt: timestamp("created_at", {
    withTimezone: true,
  })
    .defaultNow()
    .notNull(),
});

export const connectionStatusEnum = pgEnum("connection_status_enum", [
  "connected",
  "disconnected",
  "error",
]);

export const bankConnections = pgTable("bank_connections", {
  id: uuid("id").defaultRandom().primaryKey(),
  userId: uuid("user_id")
    .notNull()
    .references(() => users.id, { onDelete: "cascade" }),

  institutionName: varchar("institution_name", { length: 100 }).notNull(),
  providerToken: varchar("provider_token", { length: 255 }).notNull(),
  status: connectionStatusEnum("status").notNull().default("connected"),
  lastSyncedAt: timestamp("last_synced_at", { withTimezone: true }).defaultNow(),
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
});

export const assetTypeEnum = pgEnum("asset_type_enum", [
  "stock",
  "etf",
  "mutual_fund",
  "bond",
]);

export const portfolioHoldings = pgTable("portfolio_holdings", {
  id: uuid("id").defaultRandom().primaryKey(),
  userId: uuid("user_id")
    .notNull()
    .references(() => users.id, { onDelete: "cascade" }),

  assetType: assetTypeEnum("asset_type").notNull().default("stock"),
  symbol: varchar("symbol", { length: 50 }).notNull(),
  name: varchar("name", { length: 100 }).notNull(),
  quantity: numeric("quantity", { precision: 15, scale: 4 }).notNull(),
  averageCost: numeric("average_cost", { precision: 15, scale: 2 }).notNull(),
  currentPrice: numeric("current_price", { precision: 15, scale: 2 }).notNull(),
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
});

export const netWorthSnapshots = pgTable("net_worth_snapshots", {
  id: uuid("id").defaultRandom().primaryKey(),
  userId: uuid("user_id")
    .notNull()
    .references(() => users.id, { onDelete: "cascade" }),

  snapshotDate: timestamp("snapshot_date", { withTimezone: true }).defaultNow().notNull(),
  totalAssets: numeric("total_assets", { precision: 15, scale: 2 }).notNull(),
  totalLiabilities: numeric("total_liabilities", { precision: 15, scale: 2 }).notNull(),
  netWorth: numeric("net_worth", { precision: 15, scale: 2 }).notNull(),
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
});

export const recurringFrequencyEnum = pgEnum("recurring_frequency_enum", [
  "weekly",
  "monthly",
  "annual",
]);

export const recurringTransactions = pgTable("recurring_transactions", {
  id: uuid("id").defaultRandom().primaryKey(),
  userId: uuid("user_id")
    .notNull()
    .references(() => users.id, { onDelete: "cascade" }),
  accountId: uuid("account_id")
    .notNull()
    .references(() => accounts.id, { onDelete: "cascade" }),

  title: varchar("title", { length: 100 }).notNull(),
  amount: numeric("amount", { precision: 15, scale: 2 }).notNull(),
  type: varchar("type", { length: 20 }).notNull().default("expense"),
  category: varchar("category", { length: 100 }).notNull().default("Subscriptions"),
  frequency: recurringFrequencyEnum("frequency").notNull().default("monthly"),
  nextDate: timestamp("next_date", { withTimezone: true }).notNull(),
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
});
