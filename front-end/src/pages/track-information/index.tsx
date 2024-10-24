import { useEffect, useState } from "react";
import axios from 'axios';
import './index.scss';
import AppButton from "@components/button";
import Icons from "@components/icons";
import { useNavigate, useParams } from "react-router-dom";
import LoadingIndicator from "@components/loading";
const { REACT_APP_BASE_URL } = process.env;

const TrackInformation = () => {

    const { trackName } = useParams();

    const [dogsPerformance, setDogsPerformance] = useState([]);
    const [performanceData, setPerformanceData] = useState([]);
    const [last50Races, setLast50Races] = useState([]);
    const [trapStats, setTrapStats] = useState<any[]>([]);


    const [trainerStats, setTrainerStats] = useState([]);
    const [loading, setLoading] = useState(true);
    const [top20Loading, setTop20Loading] = useState(true);
    const [top20TrainerLoading, setTop20TrainerLoading] = useState(true);
    const [statsLoading, setStatsLoading] = useState(true);

    const [error, setError] = useState(null);
    const navigate = useNavigate();

    useEffect(() => {
        axios.get(`${REACT_APP_BASE_URL}/dog-performance`)
            .then(response => {
                setDogsPerformance(response.data);
                setTop20Loading(false)
            })
            .catch(error => {
                setTop20Loading(false)
                console.error('There was an error fetching the data!', error);
            });
    }, []);

    useEffect(() => {
        axios.get(`${REACT_APP_BASE_URL}/trainer-dog-performance`)
            .then(response => {
                setTop20TrainerLoading(false)
                setPerformanceData(response.data);
            })
            .catch(error => {
                setTop20TrainerLoading(false)
                console.error('Error fetching the data!', error);
            });
    }, []);

    useEffect(() => {
        const get_last_50_races = async () => {
            try {
                const response = await axios.get(`${REACT_APP_BASE_URL}/get_last_50_races`, {
                    params: { trackName: trackName }  // Pass the trackName as a parameter
                });
                setLast50Races(response.data);
                setLoading(false);
            } catch (err: any) {
                setError(err.message);
                setLoading(false);
            }
        };

        get_last_50_races();
    }, [trackName]);  // Re-fetch if trackName changes

    // Fetch the trainer stats from the API
    useEffect(() => {
        const fetchTrainerStats = async () => {
            try {
                const response = await axios.get(`${REACT_APP_BASE_URL}/trainer-stats`, {
                    params: { trackName: trackName }  // Pass the trackName as a parameter
                });
                setTrainerStats(response.data);
                setStatsLoading(false);
            } catch (err: any) {
                setError(err.message);
                setStatsLoading(false);
            }
        };

        fetchTrainerStats();
    }, [trackName]);  // Re-fetch if trackName changes


    useEffect(() => {
        // Fetch trap stats from the Flask API
        const fetchTrapStats = async () => {
            try {
                const response = await axios.get(`${REACT_APP_BASE_URL}/trap_stats`, {
                    params: { trackName: trackName }  // Pass the trackName as a parameter
                });
                setTrapStats(response.data.trapStats); // Set trap stats in state
            } catch (error) {
                console.error('Error fetching trap stats:', error);
            }
        };

        fetchTrapStats();
    }, []);


    const handleDownloadCSV = () => {
        const url = `http://localhost:5000/track-results-csv?trackName=${trackName}`;
        window.open(url, '_blank'); // This opens the download in a new tab
    };

    const handleDogClick = (dogName: string) => {
        // Programmatically navigate to the RaceList page with the dog's name
        navigate(`/greyhound/${dogName}`);
    };

    const handleTrainerClick = (trainerName: string) => {
        // Programmatically navigate to the RaceList page with the trainer's name
        navigate(`/trainer/${trainerName}`);
    };

    const formatWinRate = (winRate: any) => {
        const wr = Number(winRate); // Convert to number
        const formattedWinRate = isNaN(wr) ? "N/A" : wr.toFixed(2); // Check if it's a valid number
        return formattedWinRate
    }

    const formatTime = (time:any) => {
        if (!time) return "";
        
        // Split the time string by ':'
        const [hours, minutes, seconds] = time.split(':');
    
        // Parse seconds to remove any decimal places (if they exist)
        const formattedSeconds = seconds.split('.')[0]; // Take only the integer part of seconds
    
        // Return the formatted time
        return `${hours}:${minutes}:${formattedSeconds}`;
    };

    const formatDate = (dateTime:any) => {
        const date = new Date(dateTime);
        const options = { year: 'numeric', month: 'long', day: 'numeric' };
        return date.toLocaleDateString(undefined, options as any);
    };

    if(top20Loading || top20TrainerLoading || statsLoading || loading ) 
          return <LoadingIndicator/>
    return (
        <div className="track" style={{ padding: '8px' }}>
            <div className="d-flex align-items-center justify-content-between">
                <h1 style={{color:'#7E60BF'}}>{trackName} Greyhound Race Performance</h1>
                <AppButton title={`Download ${trackName} Data`} iconRight="download" onClick={() => handleDownloadCSV()} />
            </div>
            <div className="d-flex">
                <div>
                    <em><h4>TOP 20 Greyhound performance</h4></em>
                    <table className="track-info-table" style={{ marginLeft: '8px' }}>
                        <thead>
                            <tr>
                                <th>Dog </th>
                                <th>Trainer</th>
                                <th>Total Races</th>
                                <th>Wins</th>
                                <th>Win Rate (%)</th>
                            </tr>
                        </thead>
                        <tbody>
                            {top20Loading ? <LoadingIndicator/> : performanceData.map((item: any, index) => (
                                <tr key={index}>
                                    <td><span className="text-link" style={{color:'blue'}} onClick={() => handleDogClick(item.dogName)}>{item.dogName}</span></td>
                                    <td><span className="text-link" onClick={() => handleTrainerClick(item.trainerName)}>{item.trainerName}</span></td>
                                    <td>{item.TotalRaces}</td>
                                    <td>{item.Wins}</td>
                                    <td>{item.WinRatePercentage.toFixed(2)}</td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>

                <div>
                    <em><h4>TOP 20 Trainers performance</h4></em>
                    <table className="track-info-table" style={{ marginLeft: '8px' }}>
                        <thead>
                            <tr>
                                <th>Track</th>
                                <th>Trainer</th>
                                <th>Total Races</th>
                                <th>Wins</th>
                                <th>Win Rate (%)</th>
                            </tr>
                        </thead>
                        <tbody>
                            { top20TrainerLoading ? <LoadingIndicator/> : trainerStats.map((item: any, index) => (
                                <tr key={index}>
                                    <td>{item.trackName}</td>
                                    <td><span className="text-link" onClick={() => handleTrainerClick(item.trainerName)}>{item.trainerName}</span></td>
                                    <td>{item.totalRaces}</td>
                                    <td>{item.wins}</td>
                                    <td>{formatWinRate(item.winRate)}</td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>

                <div className="stats-section_tr">
                    <h3>{trackName} Stats</h3>
                    <div className="box-stats">
                        <div className="box-row">
                            <div className="box-item">
                                <div className="box-number red">1</div>
                                <div className="box-stats-info">
                                    <div>Races: <b>{trapStats.find((e:any)=>e.trapNumber==1)?.totalRaces}</b></div>
                                    <div>Wins: <b>{trapStats.find((e:any)=>e.trapNumber==1)?.totalWins}</b></div>
                                </div>
                            </div>
                            <div className="box-item">
                                <div className="box-number blue">2</div>
                                <div className="box-stats-info">
                                <div>Races: <b>{trapStats.find((e:any)=>e.trapNumber==2)?.totalRaces}</b></div>
                                <div>Wins: <b>{trapStats.find((e:any)=>e.trapNumber==2)?.totalWins}</b></div>
                                </div>
                            </div>
                            <div className="box-item">
                                <div className="box-number grey">3</div>
                                <div className="box-stats-info">
                                <div>Races: <b>{trapStats.find((e:any)=>e.trapNumber==3)?.totalRaces}</b></div>
                                <div>Wins: <b>{trapStats.find((e:any)=>e.trapNumber==3)?.totalWins}</b></div>
                                </div>
                            </div>
                        </div>
                        <div className="box-row">
                            <div className="box-item">
                                <div className="box-number black">4</div>
                                <div className="box-stats-info">
                                <div>Races: <b>{trapStats.find((e:any)=>e.trapNumber==4)?.totalRaces}</b></div>
                                <div>Wins: <b>{trapStats.find((e:any)=>e.trapNumber==4)?.totalWins}</b></div>
                                </div>
                            </div>
                            <div className="box-item">
                                <div className="box-number yellow">5</div>
                                <div className="box-stats-info">
                                <div>Races: <b>{trapStats.find((e:any)=>e.trapNumber==5)?.totalRaces}</b></div>
                                <div>Wins: <b>{trapStats.find((e:any)=>e.trapNumber==5)?.totalWins}</b></div>
                                </div>
                            </div>
                            <div className="box-item">
                                <div className="box-number striped">6</div>
                                <div className="box-stats-info">
                                <div>Races: <b>{trapStats.find((e:any)=>e.trapNumber==6)?.totalRaces}</b></div>
                                <div>Wins: <b>{trapStats.find((e:any)=>e.trapNumber==6)?.totalWins}</b></div>
                                </div>
                            </div>
                        </div>
                    </div>
                    <div className="overall-stats">
                    </div>
                </div>

            </div>

            <h4>Last 100 races</h4>
            <table className="track-info-table">
                <thead>
                    <tr>
                        <th><b>#</b></th>
                        <th>Meeting Date</th>
                        <th>Track Name</th>
                        <th>Race Time</th>
                        <th>Race Title</th>
                        <th>Race </th>
                        <th>Class </th>
                        <th>Type </th>
                        <th>Distance</th>
                        <th>Dog Name</th>
                        <th>Trainer</th>
                        <th>Run Time</th>
                    </tr>
                </thead>
                <tbody>
                    {last50Races.map((race: any, index) => (
                        <tr key={index}>
                            <td>{index+1}</td>
                            <td>{formatDate(race.meetingDate)}</td>
                            <td>{race.trackName}</td>
                            <td>{formatTime(race.raceTime)} </td>
                            <td>{race.raceTitle}</td>
                            <td>{"Race "}{race.raceNumber}</td>
                            <td>{race.raceClass}</td>
                            <td>{race.raceType}</td>
                            <td>{race.raceDistance}</td>
                            <td><span className="text-link" onClick={() => handleDogClick(race.dogName)}>{race.dogName}</span></td>
                            <td><span className="text-link" onClick={() => handleTrainerClick(race.trainerName)}>{race.trainerName}</span></td>
                            <td>{race.resultRunTime}</td>
                        </tr>
                    ))}
                </tbody>
            </table>
        </div>
    )
}

export default TrackInformation;