# AquaMarket - 3-Sided Water Supply Marketplace

This is a production-ready template for a scalable 3-sided marketplace focusing on Water Supply (Customers, Providers, Admins).

## Deliverables Completed
1. **Prisma Schema**: Full relational database schema with Roles, Status Enums, Profiles, Requests, Ratings, Notifications, and Disputes.
2. **Auth & Middleware**: Configured `next-auth` with JWT and Role-Based Access Control logic inside Next.js `middleware.ts`.
3. **Dashboards & UI**: Modern layouts using `shadcn/ui`, Tailwind CSS, and Lucide Icons. Dedicated Dashboards for Customers, Providers, and Admins.
4. **Socket Server**: Embedded custom `server.js` bringing `socket.io` into the Next.js process for real-time order tracking and dispute resolution.
5. **API Routes**: Zod-validated secure API endpoints for generating requests and retrieving vetted providers.

---

## Folder Structure

The application strictly follows separation of concerns to maintain a clean App Router setup:

```
water-supply/
├── app/                  # Next.js 14 App Router
│   ├── api/              # Core RESTful business logic and API endpoints
│   ├── dashboard/        # Role-based protected routes (admin, provider, user)
│   ├── layout.tsx        # Global layout incorporating Session/Socket providers
│   └── page.tsx          # Public landing/marketing page
├── components/           # UI and architectural components
│   ├── layout/           # Structural components (Sidebar, TopNav, DashboardLayout)
│   ├── providers/        # Client-side context (Session, Socket context)
│   └── ui/               # Reusable dumb components from shadcn/ui + custom
├── lib/                  # Utility functions and global singletons
│   ├── auth.ts           # NextAuth v4 configuration & credentials logic
│   ├── prisma.ts         # Prisma global client singleton
│   └── utils.ts          # Tailwind merge & clsx utility
├── prisma/               # Database logic
│   └── schema.prisma     # Relational schema defining data shapes and relation cascades
├── public/               # Static assets
└── types/                # TypeScript ambient and module declarations (NextAuth overrides)
```

**Why this structure?**
- **Co-location logic**: The core components are completely separated from page roots so business logic stays clean.
- **`app/api` vs `services/`**: We created `/app/api` for HTTP boundary validation using Zod. In an expanding app, these would invoke `/services` which house pure TS functions orchestrating Prisma logic.

---

## Best Practices for Scalability

1. **Database Connection Pooling**
   - Prisma initiates numerous DB connections. In production (especially serverless environments), use **Prisma Accelerate** or **PgBouncer** to pool database connections.

2. **WebSocket Scaling (Socket.io)**
   - The embedded `server.js` works perfectly for a single Node instance. As traffic grows, deploy instances behind a load balancer. **You must use the Socket.IO Redis Adapter (`@socket.io/redis-adapter`)** connected to an external Redis instance, allowing events published on Server A to be broadcast to users connected via Server B.

3. **State Management & Caching**
   - Rely on **React Server Components (RSC)** for data-fetching.
   - For client states, `React Query` combined with Server Actions handles data mutations immutably and effectively invalidates cache.

4. **Background Jobs**
   - Use a robust queue system (like **BullMQ** or **Inngest**) for computationally heavy requests, emails, or push notifications rather than coupling them synchronously to API requests.

5. **Authorization Strategy**
   - While `middleware.ts` handles coarse role-based routing (Admin vs User), use an inline CASL (or a simple RBAC function) inside Server Actions to manage granular row-level ownership (e.g., "Can User A edit Provider B's profile? No.").

6. **Observability**
   - Connect **Sentry** and **Datadog/Logtail** to catch unhandled frontend exceptions and track slow backend queries for prompt optimization.
