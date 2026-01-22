# Guest Flow SSR Migration

## Summary
Converting guest flow from query-parameter based routing to proper SSR with dynamic routes.

## Route Changes

### Old Routes (Query Params)
- `/guest?slug=yoshita-fashion-jewellery` → Login page
- `/guest/catalog?slug=yoshita-fashion-jewellery` → Catalog page

### New Routes (SSR with Dynamic Routes)
- `/guest/[slug]` → Login page (SSR)
- `/guest/[slug]/catalog` → Catalog page (SSR)

## Implementation Status

✅ **Completed:**
1. `/guest/[slug]/page.tsx` - SSR login page
2. `/guest/[slug]/GuestLoginForm.tsx` - Client login form
3. `/api/guest/set-token/route.ts` - Cookie-based token storage
4. `/api/guest/get-token/route.ts` - Cookie-based token retrieval
5. `/lib/guest-auth.ts` - Helper functions for guest auth
6. `/guest/[slug]/catalog/page.tsx` - SSR catalog page wrapper

🔄 **In Progress:**
- `/guest/[slug]/catalog/GuestCatalogClient.tsx` - Client catalog component (needs routing updates)

⏳ **Pending:**
- Update all navigation/redirects in catalog component
- Remove old query-param based pages
- Update API routes to support cookie-based auth
- Test end-to-end flow

## Key Changes Needed

### 1. Catalog Client Component
- Replace `useSearchParams().get('slug')` with `useParams().slug`
- Update all `router.push/replace` calls:
  - Old: `/guest/catalog?slug=${slug}`
  - New: `/guest/${slug}/catalog`
- Update token retrieval:
  - Old: `localStorage.getItem(\`guest_token_${slug}\`)`
  - New: Use `/api/guest/get-token?slug=${slug}` API call
- Update URL building for search/category/page:
  - Old: `/guest/catalog?slug=${slug}&category=...`
  - New: `/guest/${slug}/catalog?category=...`

### 2. API Routes
- Update `/api/guest/products/route.ts` to read token from cookies
- Update `/api/guest/categories/route.ts` to read token from cookies
- Add cookie support to `getGuestFromRequest()` helper

### 3. Cleanup
- Remove `/guest/page.tsx` (old query-param login)
- Remove `/guest/catalog/page.tsx` (old query-param catalog)
- Remove `/guest/[slug]/page.tsx` redirect (if exists)
- Remove `/guest/[slug]/catalog/page.tsx` redirect (if exists)

## Testing Checklist
- [ ] Login flow works with `/guest/[slug]`
- [ ] Catalog loads with `/guest/[slug]/catalog`
- [ ] Search/filter/pagination updates URL correctly
- [ ] Authentication persists across page refreshes
- [ ] Logout redirects correctly
- [ ] Old query-param routes redirect to new routes

