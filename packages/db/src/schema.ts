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