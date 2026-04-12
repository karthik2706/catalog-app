# Catalog App WooCommerce Sync

Install the ZIP in WordPress, then configure:

- `API Base URL`: your catalog app origin, for example `https://catalog.example.com`
- `Client Slug`: the client slug tied to the API key
- `API Key`: a key with `products:read`, `products:write`, `inventory:read`, and `inventory:write`

Features:

- Pull products and stock from the catalog app into WooCommerce by SKU
- Create or update WooCommerce simple products
- Import remote product images into the WordPress media library
- Push WooCommerce stock changes back to the catalog app
- Optionally push WooCommerce product edits back to the catalog app
- Manual sync button and scheduled pull sync
