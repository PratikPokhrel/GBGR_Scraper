import React, { useEffect, useState } from 'react';
import './index.scss';
import AppButton from '@components/button';
import axios from 'axios';
import Select from 'react-select';
import debounce from 'lodash.debounce';
import DatePicker from 'react-datepicker';
import 'react-datepicker/dist/react-datepicker.css';
const { REACT_APP_BASE_URL } = process.env;



const DownloadPage = () => {
    const [trackNames, setTrackNames] = useState([]);
    const [dogNames, setDogNames] = useState<any[]>([]);
    const [trainerNames, setTrainerNames] = useState<any[]>([]);
    const [selectedTrack, setSelectedTrack] = useState<any>(null);
    const [selectedDog, setSelectedDog] = useState<any>(null);
    const [selectedTrainer, setSelectedTrainer] = useState<any>(null);
    const [fromDate, setFromDate] = useState(null);
    const [toDate, setToDate] = useState(null);
    const [selectedTrack2, setSelectedTrack2] = useState<any>(null);
    const [raceClasses, setRaceClasses] = useState<any[]>([]);
    const [raceTypes, setRaceTypes] = useState<any[]>([]);
    const [raceDistances, setRaceDistances] = useState<any[]>([]);
    const [selectedRaceClass, setSelectedRaceClass] = useState('');
    const [selectedRaceType, setSelectedRaceType] = useState('');
    const [selectedRaceDistance, setSelectedRaceDistance] = useState('');


    const [searchDog, setSearchDog] = useState('');  // Store the search term
    const dogLimit = 20;   // Fetch 20 dog names at a time

    const [searchtrainer, setSearchtrainer] = useState('');  // Store the search term
    const trainerLimit = 20;   // Fetch 20 dog names at a time

    // Fetch trackNames (no pagination required)
    useEffect(() => {
        axios.get(`${REACT_APP_BASE_URL}/api/tracknames`)
            .then(response => {
                const options = response.data.map((track: any) => ({ label: track, value: track }));
                setTrackNames(options);
            })
            .catch(error => console.error('Error fetching track names:', error));
    }, []);



    useEffect(() => {
        axios.get(`${REACT_APP_BASE_URL}/api/dognames?limit=${dogLimit}&search=${searchDog}`)
            .then(response => {
                const options = response.data.map((dog: any) => ({ label: dog, value: dog }));
                setDogNames(options);  // Replace with new search results
            })
            .catch(error => console.error('Error fetching dog names:', error));
    }, []);

    useEffect(() => {
        axios.get(`${REACT_APP_BASE_URL}/api/trainernames?limit=${trainerLimit}&search=${searchDog}`)
            .then(response => {
                const options = response.data.map((trainer: any) => ({ label: trainer, value: trainer }));
                setTrainerNames(options);  // Replace with new search results
            })
            .catch(error => console.error('Error fetching dog names:', error));
    }, []);
    useEffect(() => {
        if (searchtrainer.length >= 2) {
            axios.get(`${REACT_APP_BASE_URL}/api/trainernames?limit=${trainerLimit}&search=${searchtrainer}`)
                .then(response => {
                    const options = response.data.map((trainer: any) => ({ label: trainer, value: trainer }));
                    setTrainerNames(options);  // Replace with new search results
                })
                .catch(error => console.error('Error fetching trainer names:', error));
        } else {
            setTrainerNames([]);  // Clear trainer names if search term is less than 2 characters
        }
    }, [searchtrainer]);

    // Fetch dog names based on search input
    useEffect(() => {
        if (searchDog.length >= 2) {
            axios.get(`${REACT_APP_BASE_URL}/api/dognames?limit=${dogLimit}&search=${searchDog}`)
                .then(response => {
                    const options = response.data.map((dog: any) => ({ label: dog, value: dog }));
                    setDogNames(options);  // Replace with new search results
                })
                .catch(error => console.error('Error fetching dog names:', error));
        } else {
            setDogNames([]);  // Clear dog names if search term is less than 2 characters
        }
    }, [searchDog]);

    // Debounce search input to prevent too many requests
    const handleDogSearch = debounce((inputValue: any) => {
        setSearchDog(inputValue);
    }, 300);  // 300ms delay

    // Debounce search input to prevent too many requests
    const handleTrainerSearch = debounce((inputValue: any) => {
        setSearchtrainer(inputValue);
    }, 300);  // 300ms delay


    const handleDownloadTrackCSV = () => {
        const url = `${REACT_APP_BASE_URL}/track-results-csv?trackName=${selectedTrack.value}`;
        window.open(url, '_blank'); // This opens the download in a new tab
    };

    const handleDownloadDogCSV = () => {
        const url = `${REACT_APP_BASE_URL}/dog-results-csv?dogName=${selectedDog.value}`;
        window.open(url, '_blank'); // This opens the download in a new tab
    };

    const handleDownloadTrainerCSV = () => {
        const url = `${REACT_APP_BASE_URL}/trainer-results-csv?trainerName=${selectedTrainer.value}`;
        window.open(url, '_blank'); // This opens the download in a new tab
    };


    const onFormDownload = async () => {
        const data = {
            trackName: selectedTrack2.value,
            raceClass: selectedRaceClass,
            raceType: selectedRaceType,
            raceDistance: selectedRaceDistance,
            fromDate: fromDate ? (fromDate as any).toISOString().split('T')[0] : null,
            toDate: toDate ? (toDate as any).toISOString().split('T')[0] : null,
        };
        try {
            const response = await fetch(`${REACT_APP_BASE_URL}/download-form-csv`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify(data),
            });

            if (response.ok) {
                const blob = await response.blob(); // Get the response as a Blob
                const url = window.URL.createObjectURL(blob); // Create a URL for the Blob
                const a = document.createElement('a'); // Create a link element
                a.style.display = 'none'; // Make it invisible
                a.href = url; // Set the link href to the Blob URL
                a.download = `${data.trackName}_results.csv`; // Set the download file name
                document.body.appendChild(a); // Append the link to the body
                a.click(); // Simulate a click to trigger the download
                window.URL.revokeObjectURL(url); // Clean up the URL
            } else {
                const errorData = await response.json(); // Parse the error response
                alert(`Error: ${errorData.message}`);
            }
        } catch (error) {
            console.error('Error downloading file:', error);
        }

        // axios.post('${REACT_APP_BASE_URL}/download-form-csv', data)
        //   .catch(error => console.error('Error fetching race details:', error));
    };

    const onResetForm = () => {
        setSelectedTrack2(null);
        setSelectedRaceClass('');
        setSelectedRaceType('');
        setSelectedRaceDistance('');
        setFromDate(null);
        setToDate(null);
    }

    const handleTrackNameChange = (selectedOption: any) => {
        setSelectedTrack2(selectedOption);

        // Fetch race details (raceClass, raceType, raceDistance) for the selected trackName
        axios.get(`${REACT_APP_BASE_URL}/api/race-drop-downs/${selectedOption.value}`)
            .then(response => {
                const raceDetails = response.data;
                const classes = [...new Set(raceDetails.map((item: any) => item.raceClass)) as any];
                const types = [...new Set(raceDetails.map((item: any) => item.raceType)) as any];
                const distances = [...new Set(raceDetails.map((item: any) => item.raceDistance)) as any];

                setRaceClasses(classes);
                setRaceTypes(types);
                setRaceDistances(distances);
            })
            .catch(error => console.error('Error fetching race details:', error));
    };


    return (
        <div className='download'>
            <div className="cards-container">
                <div className="card">
                    <h3>Select Track</h3>
                    <p>Select an option and download:</p>
                    <Select
                        options={trackNames}
                        value={selectedTrack}
                        onChange={setSelectedTrack}
                        isSearchable
                        placeholder="Select a Track"
                        menuPortalTarget={document.body} 
                        styles={{ menuPortal: base => ({ ...base, zIndex: 9999 }) }}
                    />
                    <span style={{ marginTop: '8px', width: '100%' }}>
                        <AppButton title='Download' iconRight='download' onClick={handleDownloadTrackCSV} />
                    </span>

                </div>

                <div className="card">
                    <h3>Select Greyhound</h3>
                    <p>Select an option and download:</p>
                    <Select
                        options={dogNames}
                        value={selectedDog}
                        onChange={setSelectedDog}
                        onInputChange={handleDogSearch}  // Trigger search on input change
                        isSearchable
                        styles={{ menuPortal: base => ({ ...base, zIndex: 9999 }) }}
                        menuPortalTarget={document.body} 
                        placeholder="Search for a Dog (Type 2+ characters)"
                    />
                    <span style={{ marginTop: '8px', width: '100%' }}>
                        <AppButton title='Download' iconRight='download' onClick={handleDownloadDogCSV} />
                    </span>


                </div>

                <div className="card">
                    <h3>Select Trainer</h3>
                    <p>Select an option and download:</p>
                    <Select
                        options={trainerNames}
                        value={selectedTrainer}
                        onChange={setSelectedTrainer}
                        onInputChange={handleTrainerSearch}  // Trigger search on input change
                        isSearchable
                        placeholder="Search for a Trainer (Type 2+ characters)"
                        menuPortalTarget={document.body} 
                        styles={{ menuPortal: base => ({ ...base, zIndex: 9999 }) }}
                    />

                    <span style={{ marginTop: '8px', width: '100%' }}>
                        <AppButton title='Download' iconRight='download' onClick={handleDownloadTrainerCSV} />
                    </span>

                </div>


            </div>
            <div className='cards-container'>
                <div className='card d-flex' style={{ width: '100%', margin: '20px' }} >
                    <div className='d-flex'>
                        <div style={{ minWidth: '15%' }}>
                            <h6 className='d-flex'>Select Track:</h6>
                            <Select
                                options={trackNames}
                                value={selectedTrack2}
                                onChange={handleTrackNameChange}
                                isSearchable
                                placeholder="Select a Track"
                            />
                        </div>
                        <div style={{ minWidth: '15%' }}>

                            <h6 className='d-flex'>Select Race Class:</h6>
                            <Select
                                options={raceClasses.map(cls => ({ value: cls, label: cls }))}
                                value={selectedRaceClass ? { value: selectedRaceClass, label: selectedRaceClass } : null} // Use selected state
                                onChange={(option) => setSelectedRaceClass(option?.value as any)}
                            />
                        </div>
                        <div style={{ minWidth: '15%' }}>

                            <h6 className='d-flex'>Select Race Type:  </h6>
                            <Select
                                options={raceTypes.map(type => ({ value: type, label: type }))}
                                value={selectedRaceType ? { value: selectedRaceType, label: selectedRaceType } : null} // Use selected state
                                onChange={(option) => setSelectedRaceType(option?.value as any)}
                            />
                        </div>
                        <div style={{ minWidth: '15%' }}>


                            <h6 className='d-flex'>Select Distance:</h6>
                            <Select
                                options={raceDistances.map(distance => ({ value: distance, label: distance }))}
                                value={selectedRaceDistance ? { value: selectedRaceDistance, label: selectedRaceDistance } : null} // Use selected state
                                onChange={(option) => setSelectedRaceDistance(option?.value as any)}
                            />
                        </div>
                    </div>
                    <div className='d-flex align-items-center'>
                        <div className='d-flex'>

                            <div>
                                <h6 className='d-flex'>From Date:</h6>
                                <div className='form-control'>

                                    <DatePicker selected={fromDate} onChange={(date) => {
                                        // Create a new date object using the selected date
                                        const newDate = new Date(date as any);

                                        // Optionally, convert it to UTC or set the correct time zone
                                        const utcDate = new Date(newDate.toUTCString());

                                        setFromDate(utcDate as any); // Assuming you're saving it in UTC
                                    }} />
                                </div>
                            </div>

                            <div>
                                <h6 className='d-flex'>To Date:</h6>
                                <div className='form-control'>
                                    <DatePicker selected={toDate} onChange={(date) => {

                                        // Create a new date object using the selected date
                                        const newDate = new Date(date as any);

                                        // Optionally, convert it to UTC or set the correct time zone
                                        const utcDate = new Date(newDate.toUTCString());

                                        setToDate(utcDate as any); // Assuming you're saving it in UTC
                                    }} />
                                </div>
                            </div>
                        </div>

                        <div className='d-flex'>
                            <AppButton buttonClass='reset_button' title='Reset' bg='dark' iconRight='reset' onClick={onResetForm} />
                            <AppButton title='Download' iconRight='download' onClick={onFormDownload} />
                        </div>
                    </div>
                </div>

            </div>
        </div>

    );
};

export default DownloadPage;
