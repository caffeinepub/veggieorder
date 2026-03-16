# VeggieOrder - Vegetable Ordering & Delivery App

## Current State
New project. No existing code.

## Requested Changes (Diff)

### Add
- Unified login page with two tabs: Customer Login and Admin Login
- Admin has predefined credentials (admin / admin123) stored in backend
- Customers can self-register with name, phone, and password
- Admin dashboard:
  - View all orders (pending, in-delivery, delivered)
  - Update order status (mark as in-delivery, delivered)
  - View customer list
  - Accounting view: total revenue, orders per day summary
- Customer dashboard:
  - Browse vegetable catalog (name, price, unit)
  - Add items to cart
  - Place order with delivery address
  - View their own order history and status
- Vegetable catalog managed by admin (add/edit/remove items)
- Mobile-responsive layout

### Modify
N/A

### Remove
N/A

## Implementation Plan
1. Backend: Admin auth with hardcoded credentials, customer registration/login with username+password, vegetable catalog CRUD, order placement and management, accounting summary
2. Frontend: Unified login page (Admin tab / Customer tab), Admin console (orders, customers, catalog, accounting), Customer console (catalog, cart, orders)
3. Mobile-first responsive design
