
import React, { Suspense } from "react"
import { Route, Routes } from "react-router-dom"
import PersistLogin from "shared/contexts/persistLogin"
import RequireAuth from "shared/contexts/requireAuth"
import { routes } from "shared/routes"
import { Icons } from ".."
import TrackInformation from "@pages/track-information"
import Greyhound from "@pages/greyhound"
import DownloadPage from "@pages/download"
import Trainer from "@pages/trainer"
import Layout from "@components/layout"

const Login = React.lazy(() => import('@pages/login'));
const Missing = React.lazy(() => import('@pages/missing'));
const Unauthorized = React.lazy(() => import('@pages/unauathorized'));

interface ILinkType {
    path: string;
    allowedRoles: string[];
    element: JSX.Element;
}

const RouteComponent = () => {


    function _map(link: ILinkType, idx: number) {
        return (
            <React.Fragment key={idx}>
                {link.allowedRoles && link.allowedRoles.length > 0 ?
                    <Route element={<RequireAuth allowedRoles={link.allowedRoles} />}>
                        <Route path={link.path} element={link.element} />
                    </Route>
                    :
                    <Route path={link.path} element={link.element} />}
            </React.Fragment>
        )
    }

    return (
        <Suspense fallback={<Icons name="circle" spin />}>
            <Routes>
                <Route path={routes.redirector} element={<Layout />}>
                    <Route path={routes.login} element={<Login />} />
                    <Route path={routes.unauthorized} element={<Unauthorized />} />
                    <Route path={routes.missing} element={<Missing />} />
                   
                    <Route element={<PersistLogin />}>
                      
                        <Route>
                            <Route path={routes.greyhound} element={<Greyhound />} />
                        </Route>
                        <Route>
                            <Route path={routes.trainer} element={<Trainer />} />
                        </Route>
                        <Route>
                            <Route path={routes.trackInformation} element={<TrackInformation />} />
                        </Route>
                        <Route>
                            <Route path={routes.download} element={<DownloadPage />} />
                        </Route>
                    </Route>
               
                </Route>
            </Routes>
        </Suspense>
    )
}

export default RouteComponent;