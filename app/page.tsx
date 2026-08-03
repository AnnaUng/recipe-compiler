import Link from "next/link";

export default function Home() {
  return (
    <div className="mx-auto flex max-w-5xl flex-col items-center justify-center px-4 py-24">
      <h1 className="text-center text-4xl font-bold tracking-tight text-zinc-900 dark:text-zinc-50">
        Recipe Compiler
      </h1>
      <p className="mt-4 max-w-md text-center text-lg text-zinc-600 dark:text-zinc-400">
        Import recipes from links or photos and get a clean list of ingredients,
        cost, servings, and health ratings.
      </p>
      <div className="mt-12 grid w-full max-w-2xl grid-cols-1 gap-4 sm:grid-cols-2">
        <Link
          href="/mains"
          className="group flex flex-col items-center justify-center rounded-2xl border border-zinc-200 bg-white p-10 text-center transition-shadow hover:shadow-md dark:border-zinc-800 dark:bg-zinc-900"
        >
          <span className="text-3xl">🍽️</span>
          <span className="mt-3 text-xl font-semibold text-zinc-900 dark:text-zinc-50">
            Mains
          </span>
          <span className="mt-1 text-sm text-zinc-600 dark:text-zinc-400">
            Dinners and hearty dishes
          </span>
        </Link>
        <Link
          href="/desserts"
          className="group flex flex-col items-center justify-center rounded-2xl border border-zinc-200 bg-white p-10 text-center transition-shadow hover:shadow-md dark:border-zinc-800 dark:bg-zinc-900"
        >
          <span className="text-3xl">🍰</span>
          <span className="mt-3 text-xl font-semibold text-zinc-900 dark:text-zinc-50">
            Desserts
          </span>
          <span className="mt-1 text-sm text-zinc-600 dark:text-zinc-400">
            Cakes, cookies, and sweet treats
          </span>
        </Link>
      </div>
      <Link
        href="/eat-my-fridge"
        className="group mt-4 flex w-full max-w-2xl flex-col items-center justify-center rounded-2xl border border-blue-200 bg-blue-50 p-10 text-center transition-shadow hover:shadow-md dark:border-blue-800 dark:bg-blue-900/20"
      >
        <span className="text-3xl">🧊</span>
        <span className="mt-3 text-xl font-semibold text-zinc-900 dark:text-zinc-50">
          Eat My Fridge
        </span>
        <span className="mt-1 text-sm text-zinc-600 dark:text-zinc-400">
          Select what you have at home and get recipes you can make right now
        </span>
      </Link>
      <Link
        href="/import"
        className="mt-12 rounded-full bg-zinc-900 px-6 py-3 text-sm font-medium text-white transition-colors hover:bg-zinc-700 dark:bg-zinc-100 dark:text-zinc-900 dark:hover:bg-zinc-300"
      >
        Import a Recipe
      </Link>
    </div>
  );
}