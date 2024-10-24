import React, { useEffect, useState } from 'react';
import axios from 'axios';
import { useNavigate, useParams } from 'react-router-dom';
import './index.scss';
import AppButton from '@components/button';
import Icons from '@components/icons';
import LoadingIndicator from '@components/loading';
const { REACT_APP_BASE_URL } = process.env;


const Greyhound = () => {
    const [races, setRaces] = useState([]);
    const [avgRunTimes, setAvgRunTimes] = useState([]);
    const { dogName } = useParams();
    const [loading, setLoading] = useState(true);
    const [racesLoading, setRacesLoading] = useState(true);
    const [avgRunTimeLoading, setAvgRunTimeLoading] = useState(true);
    // const [dogResultsLoading, setDogResultsLoading] = useState(true);
    const [results, setResults] = useState([]);
    const [statLoading, setStatLoading] = useState(false);
    const [boxStats, setBoxStats] = useState<any>({});
    const [stats, setStats] = useState<any>(null);
    const [dogInfo, setDogInfo] = useState<any[]>([]);

    const navigate= useNavigate();

   


    useEffect(() => {
        const fetchRaces = async () => {
            try {
                const response = await axios.get(`${REACT_APP_BASE_URL}/races/${dogName}`);
                setRaces(response.data);
            } catch (error) {
                console.error('Error fetching races:', error);
            } finally {
                setRacesLoading(false);
            }
        };

        fetchRaces();
    }, [dogName]);



    const fetchDogInfo = async () => {
        try {
            const response = await axios.get(`${REACT_APP_BASE_URL}/dog-info`, {
                params: { dogName },
            });
            setDogInfo(response.data);
        } catch (err) {
            setDogInfo([]);
        }
    };
    useEffect(()=>{
        fetchDogInfo()
    },[dogName])


    useEffect(() => {
        const getAverageRunTime = async () => {
            try {
                const response = await axios.get(`${REACT_APP_BASE_URL}/getRaceData`, {
                    params: { dogName }
                });
                setAvgRunTimes(response.data);
                setAvgRunTimeLoading(false);

            } catch (error) {
                console.error('Error fetching races:', error);
                setAvgRunTimeLoading(false);

            } finally {
                setAvgRunTimeLoading(false);
            }
        };

        getAverageRunTime();
    }, [dogName]);

    // Function to fetch greyhound stats from the Flask API
    const fetchDogStats = async () => {
        try {
            const response = await fetch(`${REACT_APP_BASE_URL}/greyhound_stats?dog_name=${dogName}`);
            if (!response.ok) throw new Error('Failed to fetch stats');
            const data = await response.json();
            setBoxStats(data);
            setLoading(false);
        } catch (err) {
            setLoading(false);
        }
    };


    useEffect(() => {
        fetch(`${REACT_APP_BASE_URL}/dogstats?dogName=${dogName}`)
          .then(response => response.json())
          .then(data => {
            setStatLoading(false)
            if (data.error) {
            setStatLoading(false)
              console.log(data.error);
            } else {
              setStats(data);
            }
          })
          .catch(err => { console.log(err.message); 
            setStatLoading(false)
          });
      }, [dogName]);
    

    useEffect(() => {
        fetchDogStats();
    }, [dogName]);  //

    if (loading) {
        return <LoadingIndicator />
    }

    const formatDate = (dateTime:any) => {
        const date = new Date(dateTime);
        const options = { year: 'numeric', month: 'long', day: 'numeric' };
        return date.toLocaleDateString(undefined, options as any);
    };
    const formatTime = (time: any) => {
        if (!time) return "";
        
        // Split the time string by ':'
        const [hours, minutes, seconds] = time.split(':');
    
        // Parse seconds to remove any decimal places (if they exist)
        const formattedSeconds = seconds.split('.')[0]; // Take only the integer part of seconds
    
        // Return the formatted time
        return `${hours}:${minutes}:${formattedSeconds}`;
    };

    const formatNumber = (num:any) => {
        return parseFloat(num).toFixed(2);
    };
    const fetchDogResults = async () => {
        try {
          const response = await fetch(`${REACT_APP_BASE_URL}/dog-results?dogName=${dogName}`);
          const data = await response.json();
        //   setDogResultsLoading(false)
    
          if (response.ok) {
            setResults(data);
          } else {
            setResults([]);
          }
        } catch (err) {
        //   setDogResultsLoading(false)
        }
      };

     

      const handleDownloadCSV = () => {
        const url = `http://localhost:5000/dog-results-csv?dogName=${dogName}`;
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

    const handleTrackClick = (trackName: string) => {
        // Programmatically navigate to the RaceList page with the trainer's name
        navigate(`/track-information/${trackName}`);
    };
    
      const handleSubmit = (e:any) => {
        e.preventDefault();
        fetchDogResults();
      };

      // Destructure stats for easier usage
    const { overall_stats, trap_stats } = boxStats;
    // Function to get total wins by trap
const getTotalWinsByTrap = (trapNumber: number) => {
    const trap = trap_stats.find((t:any) => t.trapNumber === trapNumber);
    return trap ? trap.totalWins : "-"; // Return totalWins or 0 if trap not found
};

const getTotalRunsByTrap = (trapNumber: number) => {
    const trap = trap_stats.find((t:any) => t.trapNumber === trapNumber);
    return trap ? trap.totalRuns : "-"; // Return totalWins or 0 if trap not found
};
console.log(racesLoading,"racesLoading")
console.log(avgRunTimeLoading,"avgRunTimeLoading")
console.log(statLoading,"statLoading")


if(racesLoading || avgRunTimeLoading  || statLoading )
    return <LoadingIndicator/>

    return (
        <div>
           
            <div className='d-flex' style={{padding:'8px'}}>
                <h2 style={{color:'#7E60BF'}}>{dogName}</h2>
                <AppButton bg='primary' title='Download CSV' iconRight="download" onClick={()=>handleDownloadCSV()}></AppButton>
            </div>

            <div className='d-flex justify-content-start' style={{ padding: '8px', marginTop:'-40px', fontSize:'12px' }}>
                {dogInfo && <span className="text-link">Trainer:  <span style={{color:'blue'}}>{dogInfo.length > 0 ? dogInfo[0]?.trainerName : "N/A"}</span></span>}
                {dogInfo && <span >Owner: <span style={{color:'blue'}}>  {dogInfo.length > 0 ? dogInfo[0]?.ownerName : "N/A"}</span></span>}
                {dogInfo && <span>Sire:  <span style={{color:'blue'}}>{dogInfo.length > 0 ? dogInfo[0]?.dogSire : "N/A"}</span></span>}
                {dogInfo && <span>Dam: <span style={{color:'blue'}}>{dogInfo.length > 0 ? dogInfo[0]?.dogDam : "N/A"}</span></span>}
            </div>
       
        <div className="greyhound-container">
            <div className="tables-section">
                <h3>Recent Races of <span style={{color:'blue'}}>{dogName}</span> </h3>
                <div className="card">
                    <table className="race-stats-table">
                        <thead>
                            <tr>
                                <th>Date</th>
                                <th>Track</th>
                                <th>Trap</th>
                                <th>Race</th>
                                <th>Time</th>
                                <th>Class</th>
                                <th>Type</th>
                                <th>Distance</th>
                                <th>Position</th>
                                <th>Run Time</th>
                                <th>Weight</th>
                                <th>Winner</th>
                                <th>Trainer</th>
                            </tr>
                        </thead>
                        <tbody>
                            {races.map((race:any, index) => (
                                <tr key={index}>
                                    <td>{formatDate(race.meetingDate)}</td>
                                    <td><span className="text-link" onClick={() => handleTrackClick(race.trackName)}>{race.trackName}</span></td>
                                    <td>{race.trapNumber}</td>
                                    <td>{race.raceNumber}</td>
                                    <td>{formatTime(race.raceTime)}</td>
                                    <td>{race.raceClass}</td>
                                    <td>{race.raceType}</td>
                                    <td>{race.raceDistance}</td>
                                    <td>{race.resultPosition}</td>
                                    <td>{formatNumber(race.resultRunTime)}</td>
                                    <td>{formatNumber(race.resultDogWeight)}</td>
                                    <td><span className="text-link" onClick={() => handleDogClick(race.winner)}>{race.winner}</span></td>
                                    <td><span className="text-link" onClick={() => handleTrainerClick(race.trainerName)}>{race.trainerName}</span></td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>

                {/* Second Table */}
                <h3>Avg runtime by track</h3>

                    <table className="race-stats-table" style={{width:'60%'}}>
                        <thead>
                            <tr>
                                <th>Track</th>
                                <th>Distance</th>
                                <th>Avg Runtime (s)</th>
                            </tr>
                        </thead>
                        <tbody>
                            {avgRunTimes.map((runTime:any, index) => (
                                <tr key={index}>
                                    <td><span className="text-link" onClick={() => handleTrackClick(runTime.trackName)}>{runTime.trackName}</span></td>
                                    <td>{runTime.raceDistance}</td>
                                    <td>{formatNumber(runTime.AverageRaceTime)}</td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>

            {/* Stats Section */}
            <div className="gb-stats-section">
                <h3>Greyhound Stats</h3>
                <div className="box-stats">
                    { trap_stats && 
                    <div className="box-row">
                    
                    <div className="box-item">
                            <div className="box-number red">1</div>
                            <div className="box-stats-info">
                                <div>Wins: {getTotalWinsByTrap(1)}</div>
                                <div>Runs: {getTotalRunsByTrap(1)}</div>
                            </div>
                        </div>
                       
                        <div className="box-item">
                            <div className="box-number blue">2</div>
                            <div className="box-stats-info">
                            <div>Wins: {getTotalWinsByTrap(2)}</div>
                            <div>Runs: {getTotalRunsByTrap(2)}</div>
                            </div>
                        </div>
                        <div className="box-item">
                            <div className="box-number grey">3</div>
                            <div className="box-stats-info">
                            <div>Wins: {getTotalWinsByTrap(3)}</div>
                            <div>Runs: {getTotalRunsByTrap(3)}</div>
                            </div>
                        </div>
                        <div className="box-item">
                            <div className="box-number black">4</div>
                            <div className="box-stats-info">
                            <div>Wins: {getTotalWinsByTrap(4)}</div>
                            <div>Runs: {getTotalRunsByTrap(4)}</div>
                            </div>
                        </div>
                        <div className="box-item">
                            <div className="box-number yellow">5</div>
                            <div className="box-stats-info">
                            <div>Wins: {getTotalWinsByTrap(5)}</div>
                            <div>Runs: {getTotalRunsByTrap(5)}</div>
                            </div>
                        </div>
                        <div className="box-item">
                            <div className="box-number striped">6</div>
                            <div className="box-stats-info">
                            <div>Wins: {getTotalWinsByTrap(6)}</div>
                            <div>Runs: {getTotalRunsByTrap(6)}</div>
                            </div>
                        </div>
                    </div>
}
                </div>
                <div className="overall-stats">
                    <div>Overall: <strong>{stats?.totalRaces}: {stats?.firstPositions}-{stats?.secondPositions}-{stats?.thirdPositions}</strong> W:<strong>{stats?.winPercentage}%</strong> P:<strong>{stats?.placePercentage}%</strong></div>
                    <div>Best 1st Sec/Dist: <strong>{stats?.best1stSectionalTime == 0? 'N/A' :stats?.best1stSectionalTime}</strong></div>
                </div>

                {/* <p>Total Races: {stats.totalRaces}</p>
          <p>First Positions: {stats.firstPositions}</p>
          <p>Second Positions: {stats.secondPositions}</p>
          <p>Third Positions: {stats.thirdPositions}</p>
          <p>Win Percentage: {stats.winPercentage}%</p>
          <p>Place Percentage: {stats.placePercentage}%</p>
          <p>Best 1st Sectional Time: {stats.best1stSectionalTime}</p> */}
            </div>
        </div>
        </div>
    );
};

export default Greyhound;
