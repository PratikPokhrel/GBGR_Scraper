import axios from "axios";
import { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import './index.scss'
import AppButton from "@components/button";
import LoadingIndicator from "@components/loading";
const { REACT_APP_BASE_URL } = process.env;


const Trainer = () => {
    const { trainerName } = useParams();
    const [stats, setStats] = useState([]);
    const [trainerStats, setTrainerStats] = useState([]);
    const [results, setResults] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [trainerResultLoading, setTrainerResultLoading] = useState(true);
    const [trainerStatLoading, setTrainerStatLoading] = useState(true);
    const [trainerStat2Loading, setTrainerStat2Loading] = useState(true);
    const [dogs, setDogs] = useState([]);
    const navigate = useNavigate();

    const fetchDogResults = async () => {
        try {
            const response = await fetch(`${REACT_APP_BASE_URL}/trainer-results?trainerName=${trainerName}`);
            const data = await response.json();

            if (response.ok) {
                setResults(data);
              
            } else {
                setResults([]);
            }
        } catch (err) {
        }
    };

    useEffect(() => {
        fetchDogResults()
    }, [trainerName])

    useEffect(() => {
        const fetchData = async () => {
            try {
                const response = await axios.get(`${REACT_APP_BASE_URL}/get_trainer_stats/${trainerName}`);
                setStats(response.data);
                setTrainerStatLoading(false);
            } catch (error) {
                console.error('Error fetching data', error);
                setTrainerStatLoading(false);
            }
        };
        fetchData();
    }, [trainerName]);

    useEffect(() => {
        const fetchData = async () => {
            try {
                const response = await axios.get(`${REACT_APP_BASE_URL}/top_dogs/${trainerName}`);
                setDogs(response.data);
                setTrainerResultLoading(false)
            } catch (error) {
                console.error('Error fetching data', error);
                setTrainerResultLoading(false)
            }
        };
        fetchData();
    }, [trainerName]);

     // Fetch the trainer stats when component mounts
     useEffect(() => {
        const fetchTrainerStats = async () => {
            try {
                const response = await axios.get(`${REACT_APP_BASE_URL}/trainer_stats`, {
                    params: { trainerName }
                });
                setTrainerStats(response.data);
                setTrainerStat2Loading(false)
            } catch (err) {
                setTrainerStat2Loading(false)
            }
        };

        fetchTrainerStats();
    }, [trainerName]);



    const formatDate = (dateTime: any) => {
        const date = new Date(dateTime);
        const options = { year: 'numeric', month: 'long', day: 'numeric' };
        return date.toLocaleDateString(undefined, options as any);
    };
    const formatTime = (time: any) => {
        if (!time) return "";
        const [hours, minutes, seconds] = time.split(':');
        return `${hours}:${minutes}:${seconds}`;
    };
    const formatNumber = (num: any) => {
        return parseFloat(num).toFixed(2);
    };


    const handleDogClick = (dogName: string) => {
        // Programmatically navigate to the RaceList page with the dog's name
        navigate(`/greyhound/${dogName}`);
    };

    const handleTrainerClick = (trainerName: string) => {
        // Programmatically navigate to the RaceList page with the trainer's name
        navigate(`/trainer/${trainerName}`);
    };
    const handleDownloadTrainerCSV = () => {
        const url = `http://localhost:5000/trainer-results-csv?trainerName=${trainerName}`;
        window.open(url, '_blank');
    };

    const formatWinPerc = (str: any) => {
        const num = parseFloat(str);

        // If num is a valid number, format it to 2 decimal places, otherwise return 'N/A'
        return !isNaN(num) ? num.toFixed(2) + "%" : 'N/A';
    };

    const handleTrackClick = (trackName: string) => {
        // Programmatically navigate to the RaceList page with the trainer's name
        navigate(`/track-information/${trackName}`);
    };

    if(trainerStatLoading || trainerStat2Loading || trainerResultLoading)
        return <LoadingIndicator/>

  
    const {overallStats, trapStats} = trainerStats as any;
    return (
        <div className="trainers">
            <div className="d-flex align-items-center">
                <h1 >Trainer:  <span  style={{color:'blue'}}>{trainerName}</span></h1>
                <AppButton bg='primary' title='Download CSV' iconRight="download" onClick={handleDownloadTrainerCSV}></AppButton>
            </div>
            <div className="tables-section">
                    <h4>Results by Track</h4>
                    <div className="d-flex">
                        <table className="trainer-stats-table">
                            <thead>
                                <tr>
                                    <th>Track </th>
                                    <th>Distance</th>
                                    <th>Total Races</th>
                                    <th>1st </th>
                                    <th>2nd </th>
                                    <th>3rd </th>
                                    <th>Top 3</th>
                                    <th>Avg. RT</th>
                                    <th>Fastest RT</th>
                                   
                                    <th>Win %</th>
                                </tr>
                            </thead>
                            <tbody>
                                {stats.map((stat: any, index) => (
                                    <tr key={index}>
                                        <td> <span className="text-link"  onClick={() => handleTrackClick(stat.trackName)}>{stat.trackName}</span></td>
                                        <td>{stat.raceDistance}</td>
                                        <td>{stat.totalRaces}</td>
                                        <td>{stat.wins1stPlace ? stat.wins1stPlace : "-"}</td>
                                        <td>{stat.wins2ndPlace ? stat.wins2ndPlace : "-"}</td>
                                        <td>{stat.wins3rdPlace ? stat.wins3rdPlace : "-"}</td>
                                        <td>{stat.totalTop3Finishes ? stat.totalTop3Finishes : "-"}</td>
                                        <td>{stat.averageRunTime ? stat.averageRunTime : "-" }</td>
                                        <td>{stat.fastestRunTime ? stat.fastestRunTime : "-"}</td>
                                      
                                        <td>{formatWinPerc(stat.winPercentage)}</td>

                                    </tr>
                                ))}
                            </tbody>
                        </table>

                            <div className="trainer-stats-section" style={{height:'30%'}}>
                                <h3>Trainer Stats by trap</h3>
                                <div className="box-stats-trainer">
                                    {trapStats &&
                                        <div className="box-row">
                                            <div className="d-flex flex-column" style={{width:" 100%", gap: 0}}>
                                                <div className="d-flex"> 
                                                <div className="box-item">
                                                    <div className="box-number red">1</div>
                                                    <div className="box-stats-info">
                                                        <div>Wins: {trapStats.find((t: any) => t.trapNumber == 1)?.wins}</div>
                                                        <div>Runs: {trapStats.find((t: any) => t.trapNumber == 1)?.totalRaces}</div>
                                                    </div>
                                                </div>


                                                <div className="box-item">
                                                    <div className="box-number blue">2</div>
                                                    <div className="box-stats-info">
                                                        <div>Wins: {trapStats.find((t: any) => t.trapNumber == 2)?.wins}</div>
                                                        <div>Runs: {trapStats.find((t: any) => t.trapNumber == 2)?.totalRaces}</div>
                                                    </div>
                                                </div>
                                                <div className="box-item">
                                                    <div className="box-number grey">3</div>
                                                    <div className="box-stats-info">
                                                        <div>Wins: {trapStats.find((t: any) => t.trapNumber == 3)?.wins}</div>
                                                        <div>Runs: {trapStats.find((t: any) => t.trapNumber == 3)?.totalRaces}</div>
                                                    </div>
                                                </div>
                                                </div>
                                                <div className="d-flex"> 

                                                <div className="box-item">
                                                    <div className="box-number black">4</div>
                                                    <div className="box-stats-info">
                                                        <div>Wins: {trapStats.find((t: any) => t.trapNumber == 4)?.wins}</div>
                                                        <div>Runs: {trapStats.find((t: any) => t.trapNumber == 4)?.totalRaces}</div>
                                                    </div>
                                                </div>
                                                <div className="box-item">
                                                    <div className="box-number yellow">5</div>
                                                    <div className="box-stats-info">
                                                        <div>Wins: {trapStats.find((t: any) => t.trapNumber == 5)?.wins}</div>
                                                        <div>Runs: {trapStats.find((t: any) => t.trapNumber == 5)?.totalRaces}</div>
                                                    </div>
                                                </div>
                                                <div className="box-item">
                                                    <div className="box-number striped">6</div>
                                                    <div className="box-stats-info">
                                                        <div>Wins: {trapStats.find((t: any) => t.trapNumber == 6)?.wins}</div>
                                                        <div>Runs: {trapStats.find((t: any) => t.trapNumber == 6)?.totalRaces}</div>
                                                    </div>
                                                </div>
                                            </div>
                                            </div>
                                        </div>
                                    }
                                </div>
                                <div className="overall-stats_trainer">
                                    <div>Races: <strong>{overallStats?.totalRaces}</strong> | Wins: <strong>{overallStats?.totalWins}</strong>| Places: <strong>{overallStats?.totalPlaces}</strong> | W:<strong>{formatWinPerc(overallStats?.winPercentage)}</strong> | P: <strong>{formatWinPerc(overallStats?.placePercentage)}</strong></div>
                                </div>

                            </div>
                    </div>
                
                <div>
                    <h4>Top peforming greyhounds for <span style={{color:'blue'}}>{trainerName}</span></h4>
                    <table className="trainer-stats-table">
                        <thead>
                            <tr>
                                <th>Dog Name</th>
                                <th>Sire</th>
                                <th>Dam</th>
                                <th>Total Races</th>
                                <th>1st </th>
                                <th>2nd </th>
                                <th>3rd </th>
                                <th>Top 3</th>
                                <th>Wins by trap</th>
                                <th>Win %</th>
                            </tr>
                        </thead>
                        <tbody>
                            {dogs.map((dog: any, index) => (
                                <tr key={index}>
                                    <td><strong  > <span className="text-link"  onClick={() => handleDogClick(dog.dogName)}>{dog.dogName}</span></strong></td>
                                    <td>{dog.dogSire}</td>
                                    <td>{dog.dogDam}</td>
                                    <td>{dog.totalRaces}</td>
                                    <td>{dog.wins1stPlace}</td>
                                    <td>{dog.wins2ndPlace}</td>
                                    <td>{dog.wins3rdPlace}</td>
                                    <td>{dog.totalTop3Finishes}</td>
                                    <td>
                                            <div className=" td_trap d-flex justify-content-center g-0">
                                        <div className="box-item">
                                                    <div className="box-number red">1</div>
                                                    <div className="box-stats-info">
                                                        <div><b>{dog.trap1Wins}</b></div>
                                                    </div>
                                                </div>

                                                <div className="box-item">
                                                    <div className="box-number blue">2</div>
                                                    <div className="box-stats-info">
                                                    <div><b>{dog.trap2Wins}</b></div>

                                                    </div>
                                                </div>
                                                <div className="box-item">
                                                    <div className="box-number grey">3</div>
                                                    <div className="box-stats-info">
                                                    <div><b>{dog.trap3Wins}</b></div>
                                                    </div>
                                                </div>
                                                <div className="box-item">
                                                    <div className="box-number black">4</div>
                                                    <div className="box-stats-info">
                                                    <div><b>{dog.trap4Wins}</b></div>
                                                    </div>
                                                </div>
                                                <div className="box-item">
                                                    <div className="box-number yellow">5</div>
                                                    <div className="box-stats-info">
                                                    <div><b>{dog.trap5Wins}</b></div>
                                                    </div>
                                                </div>
                                                <div className="box-item">
                                                    <div className="box-number striped">6</div>
                                                    <div className="box-stats-info">
                                                    <div><b>{dog.trap6Wins}</b></div>
                                                    </div>
                                                </div>
                                                </div>
                                        </td>
                                    <td>{formatWinPerc(dog.winPercentage)}</td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            </div>

            <div style={{marginTop:'12px'}}>
            <h4>Last 50 Races</h4>
                <table className="race-stats-table">
                    <thead>
                        <tr>
                            <th>Date</th>
                            <th>Greyhound</th>
                            <th>Track</th>
                            <th>Trap</th>
                            <th>Race</th>
                            <th>Class</th>
                            <th>Type</th>
                            <th>Distance</th>
                            <th>Result Position</th>
                            <th>Time</th>
                            <th>Weight</th>
                            <th>Winner</th>
                        </tr>
                    </thead>
                    <tbody>
                        {results.map((race: any, index) => (
                            <tr key={index}>
                                <td>{formatDate(race.meetingDate)}</td>
                                <td> <span className="text-link" onClick={() => handleDogClick(race.dogName)}>{race.dogName}</span></td>
                                <td> <span className="text-link"  onClick={() => handleTrackClick(race.trackName)}>{race.trackName}</span></td>
                                <td>{race.trapNumber}</td>
                                <td>{"Race "}{race.raceNumber}</td>
                                <td>{race.raceClass}</td>
                                <td>{race.raceType}</td>
                                <td>{race.raceDistance}</td>
                                <td>{race.resultPosition}</td>
                                <td>{race.resultRunTime}</td>
                                <td>{formatNumber(race.resultDogWeight)}</td>
                                <td> <span className="text-link" onClick={() => handleDogClick(race.winner)}>{race.winner}</span></td>
                            </tr>
                        ))}
                    </tbody>
                </table>
                </div>
        </div>
    );
}

export default Trainer;