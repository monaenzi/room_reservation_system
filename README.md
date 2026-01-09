# Room Reservation Web App

A simple and modern **room reservation web application** built with **Next.js**.

---

##  Features

- Upload of own rooms with pictures (admin)
- Browse and select available rooms  
- Book rooms with date & time selection, routine bookings are also possible
- Block Timeslots e.g. for Holidays (admin) 
- Store reservations 
- Store user information, edit it, reset password and delete user (admin)
- Send out e-mails for confirmation of booking, request password reset and confirmation of password reset

---

## Tech Stack

| Tool | Purpose |
|------|----------|
| **Next.js** | React framework for the frontend |
| **React** | Component-based UI library |
| **JavaScript/TypeScript** | Main programming languages |
| **Tailwind CSS** | Utility-first CSS framework for styling |
| **Node.js** | Runtime environment |
| **Turbopack** | Fast bundler for development |
| **ESLint** | Linting and code quality checks |
| **MariaDB** | Database used in this program |

---

##  Authentication & Middleware Notice

The current middleware used for authentication and cookie handling
works **only with Next.js 16**.

Starting with **Next.js 17+**, changes to the Edge Runtime prevent
reliable cookie setting inside middleware.

**Required Migration**
For Next.js 17+, the authentication and cookie logic must be moved to
a **proxy-based solution** (e.g. API Routes or an external backend),
where cookies are set server-side.

The middleware should then only be used for:
- routing
- access control
- redirects

---

## Project Structure

```
room-reservation/
├── app/
| ├── admin/
| | └── page.tsx
| ├── api/
| | ├── admin
| | | ├── [user_id]/
| | | | └── route.ts
| | | └── route.ts
| | ├── calendar
| | | └── route.ts
| | ├── change-password
| | | └── route.ts
| | ├── login
| | | └── route.ts
| | ├── logout
| | | └── route.ts
| | ├── pwforgotten
| | | └── route.ts
| | └── rooms
| | | └── route.ts
| ├── calender/
| | ├── page.tsx
| | └── loading.tsx
| | 
| ├── change-password/
| | └── page.tsx
| ├── kiosk/
| | └── page.tsx
| ├── login/
| | └── page.tsx
| ├── psforgotten/
| | └── page.tsx
| ├── rooms/
| | └── page.tsx
│ ├── page.js # Home page (entry point)
│ ├── layout.js # Shared layout (header, footer, metadata)
| └── globals.css # Global styles
├── components/
│ ├── Footer.tsx
| └── NavBar.tsx
├── utils/
| └── alertHelper.ts
├── public/ # Static assets (images, icons, etc.)
│ ├── icons
│ ├── pictures
│ ├── uploads
| └──  logo.svg
├── .gitignore
├── eslint.config.mjs
├── global.d.ts
├── LICENSE
├── next.config.ts
├── package.json
├── postcss.config.js
├── postcss.config.mjs
├── tailwind.config.js
├── tsconfig.json
└── README.md
```

---

## Database

The database scheme can be found under `/database/schema.sql`

---

## Getting Started

### 1. Clone the repository

```bash 
git clone https://github.com/monaenzi/room_reservation_system.git
cd room_reservation_system
```

### 2. Install dependencies

```bash
npm install
```

### 3. Create .env

Configure to your database and mailserver.

### 4. Start database

### 5. Run the development server

```bash
npm run dev
```

Then open http://localhost:3000 in your browser to view it.

---

## Requirements
- Node.js 18+  
- npm 9+ or pnpm/yarn  

---

## Authors

### Alamer Alia
- GitHub profile: [Alia-Alamer](https://github.com/Alia-Alamer)
- alia.alamer@edu.fh-joanneum.at

### Enzi Ramona
- GitHub profile: [monaenzi](https://github.com/monaenzi)
- ramona.enzi@edu.fh-joanneum.at

### Kadyrova Linda
- GitHub profile: [lindakadyrova](https://github.com/lindakadyrova)
- linda.kadyrova@edu.fh-joanneum.at

### Wychodil-Lubi Lucas
- GitHub profile: [lucaswychodil](https://github.com/lucaswychodil)
- lucas.wychodil-lubi@edu.fh-joanneum.at

## License

This project is licensed under the MIT License — see the [LICENSE](LICENSE) file for details.

