import React, { Component } from 'react';
import './App.css';

class App extends Component {
	constructor() {
		super();

		this.state = {
			reviewsLoaded: false, 
			data: '',
			inputURL: '',
			validURL: false
		};
	}

	handleChange(i) {
		this.setState({inputURL: i.target.value});
	}

	handleSubmit(i) {

		// Use callback function since if its a short URL it needs an async call to extract
		extractIosID(this.state.inputURL, (id) => {
			if(id !== 0) {
				this.setState({validURL: true});

				getIosReviews(id, (entries) => {
					// Update state with data
					this.setState({reviewsLoaded: true, data: entries});
				});
			}
			else {
				this.setState({validURL: false});
			}
		});
	}

	handleOnClickRecent(i) {
		this.setState({validURL: true});

		getIosReviews(i, (entries) => {
			// Update state with data
			this.setState({reviewsLoaded: true, data: entries});
		});
	}

	
	render() {
		var reviewApp;
		if (!this.state.reviewsLoaded) {
			reviewApp = <Home inputURL={this.state.inputURL} onChange={(i) => this.handleChange(i)} onClick={(i) => this.handleSubmit(i)} onClickRecent={(i) => this.handleOnClickRecent(i)} />;
		} else {
			reviewApp = <ReviewsPage data={this.state.data} />;
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
					Enter the App Store link of your desired app:
					<input 
						id="appstore-url"
						type="url"
						value={inputURL}
						onChange={(i) => this.props.onChange(i)}
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
		/* Pull from Local DB */
		if ( localStorage.length === 0 ) {
			// Do nothing
		}
		else {
			var recents = [];
			
			for(var i = 0; i < localStorage.length; i++) {
				var key = localStorage.key(i);

				var appId = key;
				var appObj = JSON.parse(localStorage.getItem(appId));

				var appIcon = appObj.icon;
				var appName = appObj.name;
				var appDev = appObj.dev;

				recents.push(<RecentItem onClick={(i) => this.props.onClick(i)} id={appId} icon={appIcon} name={appName} dev={appDev} key={appId} />);
			}
		}

		return (
			<div className="">
				<ul>
					{recents}
				</ul>
			</div>
		);
	}
}

function RecentItem(props) {
	return (
		<li onClick={(i) => props.onClick(props.id)}>{props.name}</li>
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
			<div className="reviewsPage">
				<AppInfo data={reviewsData} />
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
			if (index !== 0) {
				var reviewID = entry.id;
				var reviewTitle = entry.title;
				var reviewRating = entry.rating;
				var reviewUser = entry.author;
				var reviewDesc = entry.desc;
				var reviewAppVersion = entry.version;

				/* Push entry into array */
				reviews.push(<ReviewCard key={reviewID} reviewTitle={reviewTitle} reviewRating={reviewRating} reviewUser={reviewUser} reviewDesc={reviewDesc} appVersion={reviewAppVersion} />);
			}
		});

		return (
			<div className="reviews">
				{/*<input type="search" />*/}
				{reviews}
			</div>
		);
	}
}

function ReviewCard(props) {
	return (
		<div className="reviewCard" onClick="">
			<div className="starRating">{props.reviewRating}</div>
			<div className="userName">{props.reviewUser}</div>
			<div className="reviewDesc">
				{props.reviewDesc}
			</div>
		</div>
	);
}

// function ReviewDetails(props) {
// 	return (
// 		<div className="reviewDetails">
// 			<div className="starRating">{/* props.reviewRating */}</div>
// 			<div className="userName">{/* props.reviewUser */}</div>
// 			<div className="reviewDesc">
// 				{/* props.reviewDesc full */}
// 			</div>
// 		</div>
// 	);
// }




function extractIosID(url, callback) {
	// Find url in string
	var exp = /(\b(((https?|):\/\/)|www[.])[-A-Z0-9+&@#\/%?=~_|!:,.;]*[-A-Z0-9+&@#\/%=~_|])/ig;
	var parsedUrl = url.match(exp);
	parsedUrl = parsedUrl[0];

	if (parsedUrl.includes("itunes.apple.com")) {
		var startPosition = url.indexOf('id') + 2;
		var endPosition = url.indexOf('?');
		var id = url.substring(startPosition, endPosition);

		callback(id);
	}
	else if (parsedUrl.includes("appsto.re")) {
		const request = require("request");

		request({ 
			method: "HEAD", 
			url: parsedUrl, 
			followAllRedirects: true 
		}, (error, response, body) => {
			var longUrl = response.url;

			var startPosition = longUrl.indexOf('id') + 2;
			var endPosition = longUrl.indexOf('?');
			var id = longUrl.substring(startPosition, endPosition);

			callback(id);
        });
	}
	else {
		console.log("Unknown URL. Error handle");
		callback(0);
	}

	
}


function getIosReviews(id, callback) {
	var entries = [];

	for (var i = 1; i <= 10; i++) {
		var pageUrl = "https://itunes.apple.com/us/rss/customerreviews/page=" + i + "/id=" + id.toString() + "/sortby=mostrecent/json";

		const request = require("request");

		request({
			url: pageUrl,
			json: true
		},  (error, response, body) => {

			if (!error && response.statusCode === 200) {
				var pageEntries = [];
				var pageUrl = body.feed.id.label;
				var feedEntries = body.feed.entry;

				// Detect if page has no reviews, then exit
				if (feedEntries === undefined) {
					return;
				}

				feedEntries.forEach( (entry, index) => {
					if (index !== 0) {
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
					}
					else if (index === 0 && pageUrl.includes("page=1/")) {
						const appIcon = entry["im:image"][2].label.replace("100x100", "512x512");
						const appName = entry["im:name"].label;
						const appDev = entry["im:artist"].label;

						pageEntries.push(
							{
								icon: appIcon,
								name: appName,
								dev: appDev,
							}
						);

						// Save into recents
						var localStrObj = {icon: appIcon, name: appName, dev: appDev};
						localStorage.setItem(id, JSON.stringify(localStrObj));
					}
				});
			
				// Combine array from loop to existing array containing all entries
				Array.prototype.push.apply(entries, pageEntries);
				
				// Send data back
				callback(entries);
			}
		});
	}
}


export default App;
