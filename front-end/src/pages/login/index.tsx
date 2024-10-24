import AppButton from "@components/button";
import { AppDispatch, RootState } from "@store/store";
import { useEffect, useState } from "react";
import { Card } from "react-bootstrap";
import { useDispatch, useSelector } from "react-redux";
import { Link, useLocation, useNavigate } from "react-router-dom";
import useAuth from "shared/hooks/useAuth";
import { setAuthZ } from '@store/slices/auth'
import Accordion from 'react-bootstrap/Accordion';
import './index.scss'
import axios from 'axios';
import { routes } from "shared/routes";
import Icons from "@components/icons";
const { REACT_APP_BASE_URL } = process.env;





const Login = () => {
    const navigate = useNavigate();

    // const { setAuth, auth } : any = useAuth();

    // const auth = useSelector((store : RootState) => store.login.auth);
    // const loginLoading = useSelector((state: RootState) => state.login.loginLoading);

    // const dispatch = useDispatch<AppDispatch>();
    // const navigate = useNavigate();
    // const location = useLocation();
    // const from = location.state?.from?.pathname || "/";

    // const [user, setUser] = useState({ email: '', password: '' });

    // function onChange(e: any) {
    //     setUser(u => ({
    //         ...u, [e.target.name]: e.target.value
    //     }));
    // }

    // function onSubmit(e: any) {
    //     e.preventDefault();
    //     dispatch(login(user)).then((res) => {
    //         console.log("res", res.payload.token)
    //         dispatch(setAuthZ({ accessToken: res.payload.token, user: user , roles:['Admin']}));
    //         navigate(from, { replace: true });
    //     })
    // }

    // return (
    //     <div style={{ width: '100%', height: '100vh', backgroundImage: `url("https://plus.unsplash.com/premium_photo-1676310601649-c0a78a17cc20?ixlib=rb-4.0.3&ixid=MnwxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8&auto=format&fit=crop&w=1374&q=80)` }}>
    //         <div className="d-flex justify-content-around align-items-center">
    //             <Card style={{ width: '30%', marginTop: '10%' }}>
    //                 <Card.Body>
    //                     <form  onSubmit={onSubmit}>
    //                         <h3>Sign In</h3>
    //                         <div className="mb-3">
    //                             <label>Email address</label>
    //                             <input
    //                                 name="email"
    //                                 className="form-control"
    //                                 placeholder="Enter email"
    //                                 value={user.email}
    //                                 onChange={(e) => onChange(e)}
    //                             />
    //                         </div>
    //                         <div className="mb-3">
    //                             <label>Password</label>
    //                             <input
    //                                 type="password"
    //                                 name="password"
    //                                 className="form-control"
    //                                 placeholder="Enter password"
    //                                 value={user.password}
    //                                 onChange={(e) => onChange(e)}
    //                             />
    //                         </div>
    //                         <div className="mb-3">
    //                             <div className="custom-control custom-checkbox">
    //                                 <input
    //                                     type="checkbox"
    //                                     className="custom-control-input"
    //                                     id="customCheck1"
    //                                 />
    //                                 <label className="custom-control-label" htmlFor="customCheck1">
    //                                     Remember me
    //                                 </label>
    //                             </div>
    //                         </div>
    //                         <div className="d-grid">
    //                             <AppButton bg="primary" buttonHtmlType="submit"  title="Submit"  loading={loginLoading}/>
    //                         </div>
    //                         <p className="forgot-password text-right">
    //                             Forgot <a href="#">password?</a>
    //                         </p>
    //                     </form>
    //                 </Card.Body>
    //             </Card>
    //         </div>
    //     </div>
    // )

    const [meetings, setMeetings] = useState([])
    const [groupedMeetings, setGroupedMeetings] = useState([]);
    const [showAcc, setShowAcc] = useState(false);
    const [selectedMeeting, setSelectedMeeting] = useState({});
    useEffect(() => {
        // Function to fetch the data from the API
        const fetchUpcomingMeetings = async () => {
            try {
                const response = await axios.get(`${REACT_APP_BASE_URL}/api/upcoming-meetings`);
                setMeetings(response.data);  // Log the response JSON data
            } catch (error) {
                console.error('Error fetching the upcoming meetings:', error);
            }
        };

        // Call the fetch function
        fetchUpcomingMeetings();
    }, []);  // Empty dependency array to run once on component mount


    useEffect(() => {
        const groupedData = groupByMeetingDate(meetings);
        setGroupedMeetings(groupedData);
    }, [meetings]);

    const [races, setRaces] = useState([])
    const fetchRacesByMeetingID = async (id: any) => {
        try {
            const response = await axios.get(`${REACT_APP_BASE_URL}/api/races/${id}`);
            setRaces(response.data);  // Set the data in state
        } catch (err) {
        }
    };

    const onMeetingCardClick = (id: any) => {
        fetchRacesByMeetingID(id)
        setSelectedMeeting((meetings as any[]).find(e => e.MeetingID == id) as any)
        setShowAcc(true)
    }

    const [groupedRaces, setGroupedRaces] = useState([]);

    // Function to group data by RaceName
    const groupByRaceName = (data: any[]) => {
        // First, sort the data by RaceName (converted to integer)
        const sortedData = data.sort((a, b) => {
            return a.RaceName - b.RaceName; // Numeric comparison
        });
    
        // Now, group the sorted data by RaceName
        return sortedData.reduce((result, currentItem) => {
            // If the race doesn't exist in the result object, initialize it as an array
            if (!result[currentItem.RaceName]) {
                result[currentItem.RaceName] = [];
            }
            // Push the current item into the correct race group
            result[currentItem.RaceName].push(currentItem);
            return result;
        }, {});
    };
    


    useEffect(() => {
        const grouped = groupByRaceName(races);
        setGroupedRaces(grouped);
    }, [races]);

// Function to group meetings by MeetingDate and sort by MeetingDate
const groupByMeetingDate = (meetings: any[]) => {
    // First, sort meetings by MeetingDate
    const sortedMeetings = meetings.sort((a, b) => new Date(a.MeetingDate).getTime() - new Date(b.MeetingDate).getTime());

    // Then, group the meetings by MeetingDate
    return sortedMeetings.reduce((grouped, meeting) => {
        const date = meeting.MeetingDate;
        if (!grouped[date]) {
            grouped[date] = [];
        }
        grouped[date].push(meeting);
        return grouped;
    }, {} as { [key: string]: any[] });
};



    return (
        <div className="">
            {!showAcc && (
                <div style={{ padding: '12px' }}>
                    {Object.keys(groupedMeetings).map((date, gmIdx) => (
                        <div style={{ padding: '8px' }} key={gmIdx}>
                            <h3>{formatDate(date)}</h3>
                            <div className="card">
                                <div className="row">
                                    {((groupedMeetings as any)[date] as any)
                                    .sort((a: any, b: any) => a.Name.localeCompare(b.Name))
                                    .map((meeting: any, idx: any) => (
                                        <div className="col-md-3 col-sm-4" key={idx}>
                                            <Card
                                                className="gb-card-root" style={{marginLeft:'8px',marginRight:'8px'}}
                                                onClick={() => onMeetingCardClick(meeting.MeetingID)}
                                            >
                                                <Card.Body>
                                                    <div className="d-flex justify-content-between align-items-center">
                                                        <p className="meeting-name">{meeting.Name}</p>
                                                        <span className="card-details">{meeting.TotalRaces} {"Races"}</span>
                                                    </div>
                                                </Card.Body>
                                            </Card>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        </div>
                    ))}
                </div>
            )}

            {showAcc && groupedRaces && (
                <Acc races={groupedRaces} selectedMeeting={selectedMeeting} setShowAcc={setShowAcc}/>
            )}
        </div>

    )
}



// Function to format date
const formatDate = (dateString: any) => {
    const options = { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' };
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', options as any); // Format: Sunday, September 29
};


const Acc = ({ races, selectedMeeting, setShowAcc }: any) => {
    const navigate = useNavigate();


    const handleDogClick = (dogName: string) => {
        // Programmatically navigate to the RaceList page with the dog's name
        navigate(`/greyhound/${dogName}`);
    };

    const handleTrainerClick = (trainerName: string) => {
        // Programmatically navigate to the RaceList page with the trainer's name
        navigate(`/trainer/${trainerName}`);
    };

    const handleNextClick = (trackName: string) => {
        // Programmatically navigate to the RaceList page with the dog's name
        navigate(`/track-information/${trackName.replace(/\s*\(GBR\)$/, "")}`);
    };

    const getTrapNumberClass =(index:number) =>{
        if(index ==1)
            return "box-number-trap red";
        else if (index ==2)
            return "box-number-trap blue";
        else if (index ==3)
            return "box-number-trap grey";
        else if (index ==4)
            return "box-number-trap black";
        else if (index ==5)
            return "box-number-trap yellow";
        else if (index ==6)
            return "box-number-trap striped";
    }

    return (
        <div style={{ padding: '12px' }}>
            <div className="d-flex align-items-center justify-content-between">
            <span className="card-icon bg-white" onClick={()=>{setShowAcc(false)}}>
                    <Icons name="arrow-left" color="#3C84AB" />
                </span>
                <h1  style={{ paddingBottom: '16px',color:'#7E60BF' }}>{selectedMeeting.Name} Race Fields - {formatDate(selectedMeeting.MeetingDate)}
                </h1>
               
                <span className="card-icon bg-white" onClick={() => handleNextClick(selectedMeeting.Name)}>
                    <Icons name="arrow-right" color="#3C84AB" />
                </span>
            </div>
            <Accordion defaultActiveKey={['0', '1', '2', '3', '4', '5', '6', '7', '8', '9', '10', '11', '12', '13']} alwaysOpen>
                {
                    races && Object.keys(races).length !== 0 && Object.keys(races).map((raceName: any, index: number) => {
                        return (
                            <Accordion.Item eventKey={index.toString()}>
                                <Accordion.Header><strong>{"Race "}{raceName} </strong>
                                    <span style={{ marginLeft: '60%' }}>{races[raceName][0].RaceDistance} </span>
                                    <span style={{ marginLeft: '25%' }}>{races[raceName][0].RaceTime}</span>

                                </Accordion.Header>
                                <Accordion.Body>
                                    <table className="greyhound-table">
                                        <thead>
                                            <tr>
                                                <th>Trap #</th>
                                                <th>Rug/Greyhound (box)</th>
                                                <th>Trainer</th>
                                                <th>Career</th>
                                                <th>Trk/Dist</th>
                                                <th>Best T/D</th>

                                            </tr>
                                        </thead>
                                        <tbody>
                                            {
                                                races && Object.keys(races).length !== 0 && races[raceName].sort((a: any, b: any) => a.RowIndex - b.RowIndex).map((td: any, idx: number) => {
                                                    return (
                                                        <tr>
                                                            <div className={`${getTrapNumberClass(idx+1)}`}>{idx+1}</div>
                                                            <td style={{ cursor: 'pointer' }} onClick={() => handleDogClick(td.GreyhoundName)} className={idx == 1 ? "rug blue" : idx == 2 ? "rug white" : idx == 3 ? "rug black" : idx == 4 ? "rug yellow" : idx == 5 ? "rug red" : ""}>
                                                              <span className="text-link"> {td.GreyhoundName} </span>
                                                                </td>
                                                            <td  onClick={()=>{handleTrainerClick(td.TrainerName)}}> <span className="text-link" >{td.TrainerName}</span></td>
                                                            <td>{td.Career}</td>
                                                            <td>{td.Track_Dist}</td>
                                                            <td>{td.Best_Track_Dist}</td>
                                                        </tr>
                                                    )
                                                })
                                            }

                                        </tbody>
                                    </table>
                                </Accordion.Body>
                            </Accordion.Item>
                        )
                    })
                }
            </Accordion>
        </div>
    )
}
const Table = (tableData: any[]) => {
    return (
        <div className="table-container">
            <table className="greyhound-table">
                <thead>
                    <tr>
                        <th>Rug/Greyhound (box)</th>
                        <th>Form</th>
                        <th>Trainer</th>
                        <th>Early Speed</th>
                        <th>Career</th>
                        <th>Rtg</th>
                    </tr>
                </thead>
                <tbody>
                    {
                        tableData.map((td: any, idx: number) => {
                            return (
                                <tr>
                                    <td className="rug blue">{td.GreyhoundName}</td>
                                    <td>5242</td>
                                    <td>{td.TrainerName}</td>
                                    <td>82</td>
                                    <td>{td.Career}</td>
                                    <td>98</td>
                                </tr>
                            )
                        })
                    }

                </tbody>
            </table>
        </div>
    );
};

export default Login;