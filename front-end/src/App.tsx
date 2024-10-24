import './App.scss';
import Navbar from './components/navigation/navbar';
import { useLocation } from "react-router-dom"
import { routes } from 'shared/routes';
import { RouteComponent } from './components';
import 'rsuite/styles/index.less';
import "react-datepicker/dist/react-datepicker.css";

function App() {

  const { pathname } = useLocation();

  return (
    <div className='my-app'>
      {<Navbar />}
      {/* <Toastr /> */}
      <RouteComponent />
    </div>
  );
}

export default App;
