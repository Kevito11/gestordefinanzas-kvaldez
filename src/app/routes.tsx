import { createBrowserRouter } from 'react-router-dom';
import Login from '../pages/Login';
import Register from '../pages/Register';
import BudgetCalculator from '../pages/BudgetCalculator';


export const router = createBrowserRouter([
  {
    path: '/',
    element: <BudgetCalculator />,
  },
  // Keeping these routes just in case, but they are not the entry point anymore
  {
    path: '/login',
    element: <Login />,
  },
  {
    path: '/register',
    element: <Register />,
  },
]);
