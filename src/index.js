import React, { Component } from 'react';
import { createRoot } from 'react-dom/client';
import {
  BrowserRouter as Router,
  Route,
  Routes,
  useParams,
  useNavigate
} from 'react-router-dom';
import './App.css';


class App extends Component {
	constructor(props) {
        super(props);

		this.state = {
			reviewsLoaded: false, 
			data: '',
			appID: '',
			inputURL: '',
            validURL: false
		};
	}

    componentDidMount() {
        if (this.props.id) {
            this.loadReviews(this.props.id);
        }
    }

    componentDidUpdate(prevProps) {
        if (this.props.id !== prevProps.id) {
            if (this.props.id) {
                this.loadReviews(this.props.id);
            } else {
                this.setState({ reviewsLoaded: false, data: '', appID: '', validURL: false });
            }
        }
    }

    loadReviews(id) {
        getIosReviews(id, (entries) => {
            // Update state with data
            this.setState({reviewsLoaded: true, data: entries, appID: id});
        });
    }

	handleChange(i) {
		this.setState({inputURL: i.target.value});
	}

	handleSubmit(i) {
		if(this.state.inputURL !== '') {
			// Use callback function since if its a short URL it needs an async call to extract
			extractIosID(this.state.inputURL, (id) => {
				if(id !== 0) {
					this.setState({appID: id, validURL: true});
                    this.props.navigate('/' + id);
				}
				else {
					// Invalid URL
					this.setState({validURL: false});
				}
			});
		}
		else {
			// No text in URL input field
			console.log('No text in URL input field');
		}
	}

	handleOnClickRecent(id) {
		this.setState({appID: id, validURL: true});
        this.props.navigate('/' + id);
	}




	
	render() {
        var reviewApp;
        if (this.props.id && this.state.reviewsLoaded) {
            reviewApp = <ReviewsPage data={this.state.data} />;
        } else if (this.props.id) {
             reviewApp = <div>Loading...</div>; // Or keep generic loading state
        } else {
            reviewApp = <Home inputURL={this.state.inputURL} onChange={(i) => this.handleChange(i)} onClick={(i) => this.handleSubmit(i)} onClickRecent={(i) => this.handleOnClickRecent(i)} />;
        }
		
		return (
			<div className="App">
				{reviewApp}
			</div>
		);
	}
}

class Home extends Component {
	render() {
		return (
			<div className="Home">
				<URLForm inputURL={this.props.inputURL} onChange={(i) => this.props.onChange(i)} onClick={(i) => this.props.onClick(i)} />
				<Recents onClick={(i) => this.props.onClickRecent(i)} />
			</div>
		);
	}
}


class URLForm extends Component {
	render() {
		const inputURL = this.props.inputURL;
		const validationMsg = '';

		return (
			<div className="urlForm">
				<label htmlFor="appstore-url">
					Paste the App Store link of your desired app:
					<input 
						id="appstore-url"
						type="text"
						value={inputURL}
						onChange={(i) => this.props.onChange(i)}
						onKeyPress={(i) => (i.key === 'Enter') ? this.props.onClick(i) : 'Else, do nothing' }
					/>
				</label>
				<p className="inlineValidation">{validationMsg}</p>
				<button onClick={(i) => this.props.onClick(i)}>
					View Reviews
				</button>
			</div>
		);
	}
}

class Recents extends Component {
	render() {
		var recents = [];
		
		// Pull from Local DB
		if ( localStorage.length !== 0 ) {
			for(var i = 0; i < localStorage.length; i++) {
				var key = localStorage.key(i);
				var appId = key;

				try {
					var appObj = JSON.parse(localStorage.getItem(appId));

					// Validate that the object has the required properties
					if (appObj && appObj.name) {
						var appIcon = appObj.icon;
						var appName = appObj.name;
						var appDev = appObj.dev;

						recents.push(<RecentItem onClick={(i) => this.props.onClick(i)} id={appId} icon={appIcon} name={appName} dev={appDev} key={appId} />);
					}
				} catch (e) {
					// Ignore invalid JSON or non-app items in localStorage
					console.warn("Skipping invalid localStorage item:", key);
				}
			}
		}

		// Control if Recents should display or not
		var showRecents = false;
		if (recents.length === 0) {
			showRecents = true;
		}

		return (
			<div className={showRecents ? 'hidden' : 'recentsContainer'}>
				<h1 className="subheader">Recents</h1>
				<ul>
					{recents}
				</ul>
			</div>
		);
	}
}

function RecentItem(props) {
	return (
		<li className="recentItem" onClick={(i) => props.onClick(props.id)}>{props.name}</li>
	);
}


class ReviewsPage extends Component {
	constructor(props) {
        super(props);

		this.state = {data: this.props.data};
	}

	render() {
		var reviewsData = this.state.data;        

		return (
			<div className="Reviews">
				{/* <AppInfo data={reviewsData} /> */}
				<Reviews data={reviewsData} />
			</div>
		);
	}
}


class AppInfo extends Component {
	render() {
		const entries = this.props.data;
		const appInfoEntry = entries[0];
		const appIcon = appInfoEntry.icon;
		const appName = appInfoEntry.name;
		const appDev = appInfoEntry.dev;

		return (
			<div className="appInfo">
				<img src={appIcon} alt="App Name"/>
				<h1>{appName}</h1>
				<p>By {appDev}</p>
			</div>
		);
	}
}

class Reviews extends Component {
	render() {
		var reviews = [];
		const entries = this.props.data;		

		entries.forEach(function(entry, index) {
			// if (index !== 0) {
				var reviewID = entry.id;
				var reviewTitle = entry.title;
				var reviewRating = entry.rating;
				var reviewUser = entry.author;
				var reviewDesc = entry.desc;
				var reviewAppVersion = entry.version;

				/* Push entry into array */
				reviews.push(<ReviewCard key={reviewID} reviewTitle={reviewTitle} reviewRating={reviewRating} reviewUser={reviewUser} reviewDesc={reviewDesc} appVersion={reviewAppVersion} />);
			// }
		});

		return (
			<div className="reviewsContainer">
				{/*<input type="search" />*/}
				<h1 className="subheader">{reviews.length} Reviews</h1>
				{reviews}
			</div>
		);
	}
}

class ReviewCard extends Component {
	render() {
		var starRatingText;
		switch(this.props.reviewRating) {
			default:
				break;
			case "1":
				starRatingText = "star"
				break;
			case "2":
				starRatingText = "star star"
				break;
			case "3": 
				starRatingText = "star star star"
				break;
			case "4":
				starRatingText = "star star star star"
				break;
			case "5":
				starRatingText = "star star star star star"
				break;
		}

		return (
			<div className="reviewCard">
				<div className={"material-icons starRating starRating"+this.props.reviewRating}>{starRatingText}</div>
				<p className="userName">{this.props.reviewUser}</p>
				<h1 className="title">{this.props.reviewTitle}</h1>
				<div className="reviewDesc">
					{this.props.reviewDesc}
				</div>
			</div>
		);
	}
}

function extractIosID(url, callback) {
	// Find url in string
	var exp = /(\b(((https?|):\/\/)|www[.])[-A-Z0-9+&@#\/%?=~_|!:,.;]*[-A-Z0-9+&@#\/%=~_|])/ig;
	var parsedUrl = url.match(exp);

	if ((typeof parsedUrl !== "undefined" && parsedUrl !== null) ) {
		parsedUrl = parsedUrl[0];
		
		if (parsedUrl.indexOf('apps.apple.com') !== -1) {
			var match = parsedUrl.match(/\bid(\d+)/i);
			if (match) {
				var id = match[1];
				console.log(id);
				callback(id);
			} else {
				// Fallback or error handling if needed, though regex should catch valid IDs
				console.log("Could not extract ID from URL");
				callback(0);
			}
		}
		else if (parsedUrl.indexOf("appsto.re") !== -1) {

			getLongUrl(parsedUrl, (longUrl) => {
				var match = longUrl.match(/\bid(\d+)/i);
				if (match) {
					var id = match[1];
					callback(id);
				} else {
					callback(0);
				}
			});
		}
		else {
			console.log("Unknown URL. Error handle");
			callback(0);
		}	
	}
}

function getLongUrl(shortUrl, callback) {
	// const request = require("request");
	// request({ 
	// 	url: shortUrl,
	// 	followAllRedirects: true 
	// }, (error, response, body) => {
	// 	console.log(response);

	// 	callback(response.url);
	// });
	var xhttp = new XMLHttpRequest();
	xhttp.onreadystatechange = function() {
		if (this.readyState === 4 && this.status === 200) {
			callback(xhttp.responseURL);
		}
	}
	xhttp.open("GET", shortUrl, true);
	xhttp.send();
}


// Wrapper component to use useParams hook and pass to App
function AppWrapper() {
	const { id } = useParams();
    const navigate = useNavigate();
	return <App id={id} navigate={navigate} />;
}

function getIosReviews(id, callback) {
	var entries = [];

	for (var i = 1; i <= 10; i++) {
		var pageUrl = "https://itunes.apple.com/us/rss/customerreviews/page=" + i + "/id=" + id.toString() + "/sortby=mostrecent/json";

		fetch(pageUrl)
			.then(response => {
				if (response.ok) {
					return response.json();
				}
				throw new Error('Network response was not ok');
			})
			.then(body => {
				var pageEntries = [];
				var pageUrl = body.feed.id.label;
				var feedEntries = body.feed.entry;

				// Detect if page has no reviews, then exit
				if (feedEntries === undefined) {
					return;
				}

				feedEntries.forEach( (entry, index) => {
					// if (index !== 0) {
						var reviewID = entry.id.label;
						var reviewTitle = entry.title.label;
						var reviewRating = entry["im:rating"].label;
						var reviewUser = entry.author.name.label;
						var reviewDesc = entry.content.label;
						var reviewAppVersion = entry["im:version"].label;

						/* Push entry into array */
						pageEntries.push(
							{
								id: reviewID,
								author: reviewUser,
								title: reviewTitle,
								desc: reviewDesc,
								rating: reviewRating,
								version: reviewAppVersion
							}
						);
					// }
					if (index === 0 && (pageUrl.includes("page=1/") || pageUrl.includes("page=1?"))) {
						// Fetch and save app details using Lookup API
						saveAppDetails(id);
					}
				});

				// Combine array from loop to existing array containing all entries
				Array.prototype.push.apply(entries, pageEntries);

				// Send data back
				callback(entries);
			})
			.catch(error => {
				console.error('Error fetching reviews:', error);
			});
	}
}

function saveAppDetails(id) {
	const lookupUrl = "https://itunes.apple.com/lookup?id=" + id;
    
    fetchJSONP(lookupUrl, (data) => {
        if (data.results && data.results.length > 0) {
            const app = data.results[0];
            const localStrObj = {
                icon: app.artworkUrl512 || app.artworkUrl100,
                name: app.trackName,
                dev: app.artistName
            };
            localStorage.setItem(id, JSON.stringify(localStrObj));
        }
    });
}

function fetchJSONP(url, callback) {
    const callbackName = 'jsonp_callback_' + Math.round(100000 * Math.random());
    window[callbackName] = function(data) {
        delete window[callbackName];
        document.body.removeChild(script);
        callback(data);
    };

    const script = document.createElement('script');
    script.src = url + (url.indexOf('?') >= 0 ? '&' : '?') + 'callback=' + callbackName;
    document.body.appendChild(script);
}



const root = createRoot(document.getElementById('root'));
root.render(
    <Router>
        <Routes>
            <Route path="/" element={<AppWrapper />} />
            <Route path="/:id" element={<AppWrapper />} />
        </Routes>
    </Router>
);