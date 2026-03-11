import { useState } from 'react'
import {createBrowserRouter, RouterProvider} from 'react-router-dom'
import './App.css'
import { Login } from './pages/login'
import { SignUp } from './pages/signup'
import { MainLayout } from './pages/mainlayout'
import { Mealpage } from './pages/meal-plan'
import { Homepage } from './pages/home'
import { Aboutpage } from './pages/about'
import { Recipes } from './pages/recipe'
import { SharedRecipes } from './pages/sharedRecipes'
import { ThisWeek } from './pages/thisWeek'
import { RecipeDetails } from './pages/recipeDetails'
import { MyRecipes } from './pages/myRecipes'
import { FavoritePage } from './pages/favorite'
import { Shopping } from './pages/shopping'
import { SearchResults } from './pages/searchResults'
import { Profile } from './pages/profile'
import { OAuthHandler } from './pages/OAuthHandler'
import { Settings } from './pages/settings'
import { ProtectedRoute } from './pages/protectedRoute'
import { ForgotPassword } from './pages/forgotPassword'
import { ResetPassword } from './pages/resetPassword'

const router = createBrowserRouter([
  {
    path: "/signup",
    element: <SignUp />
  },
  {
    path: "/login", 
    element: <Login />
  },
  {
    path: "/forgot-password",
    element: <ForgotPassword />
  },
  {
    path: "/reset-password",
    element: <ResetPassword />
  },
  {
    element: <ProtectedRoute />,
    children: [
      {path: "/complete-profile", element: <OAuthHandler />},
      {path: "/settings", element: <Settings />}
    ]
  },
  {
    element: <MainLayout />,
    children: [
      { path: "/", element: <Homepage /> },
      { path: "/about", element: <Aboutpage /> },
      { path: "/recipes/:recipe_id", element: <RecipeDetails /> },
      {
        element: <ProtectedRoute />,
        children: [
          { path: "/meal", element: <Mealpage /> },
          { path: "/recipes", element: <Recipes /> },
          { path: "/user/recipes", element:<MyRecipes />},
          { path: "/shared-recipes", element: <SharedRecipes /> },
          { path: "/week", element: <ThisWeek /> },
          { path: "/user/favorites", element: <FavoritePage /> },
          { path: "/shopping", element: <Shopping />},
          { path: "/search", element: <SearchResults />},
          { path: "/profile", element: <Profile />}
        ]
      }
    ]
  }
])

export default router
