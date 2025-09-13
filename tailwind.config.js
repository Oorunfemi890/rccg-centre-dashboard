/** @type {import('tailwindcss').Config} */
module.exports = {
	darkMode: ["class"],
	content: [
	  "./pages/**/*.{js,jsx}",
	  "./components/**/*.{js,jsx}",
	  "./app/**/*.{js,jsx}",
	  "./src/**/*.{js,jsx}",
	],
	prefix: "",
	theme: {
	  container: {
		center: true,
		padding: "2rem",
		screens: {
		  "2xl": "1400px",
		},
	  },
	  extend: {
		colors: {
		  border: "hsl(var(--border))",
		  input: "hsl(var(--input))",
		  ring: "hsl(var(--ring))",
		  background: "hsl(var(--background))",
		  foreground: "hsl(var(--foreground))",
		  primary: {
			DEFAULT: "#1e40af", // ✅ Removed duplicated key
			foreground: "hsl(var(--primary-foreground))",
		  },
		  secondary: {
			DEFAULT: "#f59e0b",
			foreground: "hsl(var(--secondary-foreground))",
		  },
		  destructive: {
			DEFAULT: "hsl(var(--destructive))",
			foreground: "hsl(var(--destructive-foreground))",
		  },
		  muted: {
			DEFAULT: "hsl(var(--muted))",
			foreground: "hsl(var(--muted-foreground))",
		  },
		  accent: {
			DEFAULT: "hsl(var(--accent))",
			foreground: "hsl(var(--accent-foreground))",
		  },
		  popover: {
			DEFAULT: "hsl(var(--popover))",
			foreground: "hsl(var(--popover-foreground))",
		  },
		  card: {
			DEFAULT: "hsl(var(--card))",
			foreground: "hsl(var(--card-foreground))",
		  },
		  sidebar: {
			DEFAULT: "hsl(var(--sidebar-background))",
			foreground: "hsl(var(--sidebar-foreground))",
			primary: "hsl(var(--sidebar-primary))",
			"primary-foreground": "hsl(var(--sidebar-primary-foreground))",
			accent: "hsl(var(--sidebar-accent))",
			"accent-foreground": "hsl(var(--sidebar-accent-foreground))",
			border: "hsl(var(--sidebar-border))",
			ring: "hsl(var(--sidebar-ring))",
		  },
		},
		borderRadius: {
		  none: "0px",
		  sm: "4px",
		  DEFAULT: "8px",
		  md: "12px",
		  lg: "16px",
		  xl: "20px",
		  "2xl": "24px",
		  "3xl": "32px",
		  full: "9999px",
		  button: "8px",
		},
		fontFamily: {
		  pacifico: ["Pacifico", "cursive"],
		  inter: ["Inter", "sans-serif"],
		},
		keyframes: {
		  "accordion-down": {
			from: { height: "0" },
			to: { height: "var(--radix-accordion-content-height)" },
		  },
		  "accordion-up": {
			from: { height: "var(--radix-accordion-content-height)" },
			to: { height: "0" },
		  },
		  float: {
			"0%": {
			  transform: "translateY(0) translateX(0)",
			},
			"25%": {
			  transform: "translateY(-5px) translateX(5px)",
			},
			"50%": {
			  transform: "translateY(-10px) translateX(0)",
			},
			"75%": {
			  transform: "translateY(-5px) translateX(-5px)",
			},
			"100%": {
			  transform: "translateY(0) translateX(0)",
			},
		  },
		},
		animation: {
		  "accordion-down": "accordion-down 0.2s ease-out",
		  "accordion-up": "accordion-up 0.2s ease-out",
		  float: "float 3s ease-in-out infinite",
		},
	  },
	},
	plugins: [require("tailwindcss-animate")],
  };
  