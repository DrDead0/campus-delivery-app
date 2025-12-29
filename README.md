# Campus Delivery App

A robust, multi-role food delivery platform tailored for university campuses. This application bridges the gap between students, campus stores, and administrators, offering a seamless ordering experience and powerful management tools.

## 🚀 Key Features

### 👤 User Portal (Students/Staff)
- **Seamless Ordering**: Browse campus stores, view detailed menus, and place orders with ease.
- **Vending Machine Integration**: Unique interface to browse and order from smart vending machines across campus.
- **Smart Cart**: Persistent cart functionality with real-time price calculation.
- **Secure Payments**: Integrated **Razorpay** gateway for safe and reliable transactions.
- **Real-Time Tracking**: Track order status from "Pending" to "Delivered".
- **Order History**: Comprehensive dashboard to view past orders and spending patterns.
- **Profile Management**: Manage delivery addresses and personal details.

### 🏪 Store Portal (Vendors)
- **Menu Management**: Full control to add, edit, or remove items (products) with images, prices, and stock status.
- **Order Management**: Real-time dashboard to receive incoming orders and update statuses (Pending -> Preparing -> Ready -> Delivered).
- **Store Profile**: Manage store hours, description, and branding.

### 🛡️ Admin Dashboard (Super Admin)
- **Centralized Control**: Comprehensive overview of all platform activities.
- **Store Management**: Onboard new stores, manage existing accounts, and oversee store performance.
- **Vending Network**: Manage vending machine locations, stock, and status.
- **Event Management**: Create and manage campus updates or food-related events.
- **Product Oversight**: Global view of products across all stores.

## 🛠️ Technology Stack

- **Frontend Framework**: [Next.js 16](https://nextjs.org/) (App Directory)
- **Language**: [TypeScript](https://www.typescriptlang.org/)
- **UI & Styling**: 
  - [Tailwind CSS](https://tailwindcss.com/) for responsive design.
  - [Radix UI](https://www.radix-ui.com/) & [shadcn/ui](https://ui.shadcn.com/) for accessible components.
  - [Lucide React](https://lucide.dev/) for iconography.
- **Backend & Database**:
  - **Database**: [MongoDB](https://www.mongodb.com/) (using [Mongoose](https://mongoosejs.com/) ORM).
  - **Authentication**: Custom JWT-based auth with [bcryptjs](https://www.npmjs.com/package/bcryptjs) hashing.
- **Payments**: [Razorpay](https://razorpay.com/) integration.
- **Form Handling**: [React Hook Form](https://react-hook-form.com/) + [Zod](https://zod.dev/) validation.

## 🏁 Getting Started

### Prerequisites

Ensure you have the following installed:
- **Node.js** (v18 or higher)
- **MongoDB** (Local instance or Atlas connection)
- **npm** or **pnpm**

### Installation

1.  **Clone the repository**:
    ```bash
    git clone <repository-url>
    cd campus-delivery-app
    ```

2.  **Install dependencies**:
    ```bash
    npm install
    # or
    pnpm install
    ```

3.  **Environment Configuration**:
    Create a `.env.local` file in the root directory and populate it with the necessary keys (see below).

4.  **Run the application**:
    ```bash
    npm run dev
    ```
    Access the app at [http://localhost:3000](http://localhost:3000).

## 🔐 Environment Variables

The application requires the following environment variables to function correctly.

**`.env.local`**:

```env
# 🗄️ Database
MONGODB_URI=mongodb+srv://<username>:<password>@cluster.mongodb.net/campus-db

# 🔑 Authentication
JWT_SECRET=your_super_secret_jwt_key

# 💳 Payments (Razorpay)
NEXT_PUBLIC_RAZORPAY_KEY_ID=rzp_test_...
RAZORPAY_KEY_SECRET=your_razorpay_secret

# 🛡️ Super Admin Credentials
ADMIN_USERNAME=admin
ADMIN_PASSWORD=secure_admin_password

# 🌐 App Config
NEXT_PUBLIC_APP_URL=http://localhost:3000
```

## 📂 Project Structure

A quick look at the top-level directory structure:

- **`/app`**: Next.js App Router structure.
  - **`/admin`**: Super admin dashboard routes and actions.
  - **`/api`**: Backend API routes (Auth, Webhooks).
  - **`/restaurant`**: User-facing store browsing and "My Store" interfaces.
  - **`/models`**: Mongoose schemas (User, Store, Order, Product, etc.).
- **`/components`**: Reusable React components (UI primitives, feature-specific blocks).
- **`/lib`**: Shared utilities (DB connection, formatters).
- **`/public`**: Static assets.

## 📜 Scripts

- `npm run dev`: Start the development server.
- `npm run build`: Build the app for production.
- `npm start`: Run the production build.
- `npm run lint`: Run ESLint to ensure code quality.

## 👥 Contributors & Managers

This project is actively maintained and managed by:

- **Aashish Raj** ([@aashishrajdev](https://github.com/aashishrajdev))
- **Ashish Chaurasiya** ([@drdead](https://github.com/drdead))
