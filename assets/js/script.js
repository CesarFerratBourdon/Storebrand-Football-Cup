var players = [];

var originalPlayersList = [];

var	filters = {};

var results = [];

var isFiltered = false;

//	Checkbox filtering
var checkboxes = document.querySelectorAll('.all-players input[type=checkbox]');


checkboxes.forEach(function(checkbox) {
	checkbox.addEventListener('click', function () {

		var that = this;
		var	specName = that.getAttribute('name');
		
		if (that.checked === true) {

			// If the filter for this specification isn't created yet - do it.
			if (!(filters[specName] && filters[specName].length)){
				filters[specName] = [];
			}

			//	Push values into the chosen filter array
			filters[specName].push(that.value);

			// Change the url hash;
			createQueryHash(filters);

		}

		// When a checkbox is unchecked we need to remove its value from the filters object.
		if (that.checked === false) {

			if (filters[specName] && filters[specName].length && (filters[specName].indexOf(that.value) != -1)) {

				// Find the checkbox value in the corresponding array inside the filters object.
				var index = filters[specName].indexOf(that.value);

				// Remove it.
				filters[specName].splice(index, 1);

				// If it was the last remaining value for this specification,
				// delete the whole array.
				if (!filters[specName].length) {
					delete filters[specName];
				}

			}

			// Change the url hash;
			createQueryHash(filters);
		}
	});
});

// Sliders filtering

var sliders = document.querySelectorAll('.all-players input[type=range]');

sliders.forEach(function(slider) {
	slider.addEventListener('change', function () {

		var that = this;
		var	category = that.getAttribute('name');
		
		if (that.value > 0) {

			filters[category] = [];

			//	Push values into the chosen filter array
			filters[category].push(that.value);

			// Change the url hash;
			createQueryHash(filters);

		} else { // When a slider is brought back to 0 we need to remove its value from the filters object.

			if (filters[category] && filters[category].length) {
				delete filters[category];
			}

			// Change the url hash;
			createQueryHash(filters);
		}
	});
});




// When the "Clear all filters" button is pressed change the hash to '#' (go to the home page)
document.querySelector('.filters button').addEventListener('click', function (e) {
	e.preventDefault();
	window.location.hash = '#';
});


// Single player page buttons

var singlePlayerPage = document.querySelector('.single-player');

singlePlayerPage.addEventListener('click', function (e) {
	if (singlePlayerPage.classList) {
		if (singlePlayerPage.classList.contains('visible')) {
			var clicked = e.target;
			if (clicked.classList) {
				// If the close button or the background are clicked go to the previous page.
				if (clicked.classList.contains('close') || clicked.classList.contains('overlay')) {
					singlePlayerPage.classList.remove('visible');
					// Change the url hash with the last used filters.
					createQueryHash(filters);
				}
			}
		}
	}

});


// These are called on page load

// Get data about our players from players.json.
function loadJSON(callback) {   
	var xhr = new XMLHttpRequest();
		xhr.overrideMimeType("application/json");
	xhr.open('GET', 'players.json', true);
	xhr.onreadystatechange = function () {
			if (xhr.readyState == 4 && xhr.status == "200") {
			// Required use of an anonymous callback as .open will NOT return a value but simply returns undefined in asynchronous mode
			callback(xhr.responseText);
			}
	};
	xhr.send(null);  
}

function init() {
	loadJSON(function(response) {
		// Parse JSON string into object
		players = JSON.parse(response);
		originalPlayersList = JSON.parse(response);
		// Call a function to create HTML for all the players.
		generateAllPlayersHTML(players);
		// Manually trigger a hashchange to start the app.
		var event = document.createEvent('HTMLEvents');
		event.initEvent('hashchange', true, false);
		window.dispatchEvent(event);
	});
}

init();


// An event handler with calls the render function on every hashchange.
// The render function will show the appropriate content of out page.
window.addEventListener('hashchange', function(){
	render(decodeURI(window.location.hash));
});


// Navigation

function render(url) {

	// Get the keyword from the url.
	var temp = url.split('/')[0];

	// Hide whatever page is displayed.
	var currentlyShownPage = document.querySelector('.main-content .page');

	if (currentlyShownPage.classList && currentlyShownPage.classList.contains('visible')) {
		currentlyShownPage.classList.remove('visible');
	}

	var	map = {

		// The "Homepage".
		'': function() {

			// Clear the filters object, uncheck all checkboxes, show all the players
			filters = {};
			checkboxes.forEach(function(checkbox) {
				checkbox.checked = false;
			});

			renderPlayersPage(players);
		},

		// Single players page.
		'#player': function() {

			// Get the index of which player we want to show and call the appropriate function.
			var index = url.split('#player/')[1].trim();

			renderSinglePlayerPage(index, players);
		},

		// Page with filtered players
		'#filter': function() {

			// Grab the string after the '#filter/' keyword. Call the filtering function.
			var urlObject = url.split('#filter/')[1].trim();

			// Try and parse the filters object from the query string.
			try {
				filters = JSON.parse(urlObject);
			}
			catch (err) {
				window.location.hash = '#';
				return;
			}
			renderFilterResults(filters, players);
		}

	};

	if  (map[temp]) {
		map[temp]();
	} else {
		renderErrorPage();
	}

}

//Format salary to USA standard
var formatter = new Intl.NumberFormat('en-US', {
	style: 'currency',
	currency: 'USD',
	minimumFractionDigits: 0,
  });


// This function is called only once - on page load.
// It fills up the players list via a handlebars template.
// It recieves one parameter - the data we took from players.json.
function generateAllPlayersHTML(players){

	var template = document.getElementById('player-template');
	var templateHtml = template.innerHTML;
	var listHtml = "";

	for (i = 0; i < players.length; i++) {
		listHtml += templateHtml.replace(/{id}/g, players[i].id)
								.replace(/{image.small}/g, players[i].image.small)
								.replace(/{name}/g, players[i].name)
								.replace(/{specs.team}/g, players[i].specs.team)
								.replace(/{specs.age}/g, players[i].specs.age)
								.replace(/{specs.position}/g, players[i].specs.position)
								.replace(/{specs.flair}/g, players[i].specs.flair)
								.replace(/{salary}/g, formatter.format(players[i].salary));
	};
		
	var playersList = document.querySelector(".players-list");
	playersList.innerHTML = listHtml;

	// Each players has a data-index attribute.
	// On click change the url hash to open up a preview for this player only.
	// Remember: every hashchange triggers the render function.

	playersList.querySelectorAll('li').forEach(function(player) {
		player.addEventListener('click', function (e) {
			e.preventDefault();
			var playerIndex = this.getAttribute('player-index');
			window.location.hash = 'player/' + playerIndex;
		});
	})
}

// This function receives an object containing all the players we want to show.
function renderPlayersPage(players) {

	var page = document.querySelector('.all-players');

	var allPlayersCards = document.querySelectorAll('.all-players .players-list > li');

	// Iterate over all of the players.
	// If their ID is somewhere in the data object remove the hidden class to reveal them.
	allPlayersCards.forEach(function(playerCard) {
		// Hide all the players in the players list.
		if (playerCard.classList) {
			playerCard.classList.add('hidden');
		} else {
			playerCard.className += ' hidden';
		}

		if (players.length) {
			players.forEach(function(player) {
				if (playerCard.getAttribute('player-index') === player.id.toString()) {
					if (playerCard.classList) {
						playerCard.classList.remove('hidden');
						} else {
							playerCard.className -= ' hidden';
						}
				}
			});
		};

	});		

	// Show the page itself.
	// (the render function hides all pages so we need to show the one we want).
	if (page.classList) {
		page.classList.add('visible');
	} else {
		page.className += ' visible';
	}

}


// Opens up a preview for one of the players.
// Its parameters are an index from the hash and the players object.
function renderSinglePlayerPage(index, players){

	var page = document.querySelector('.single-player');
	var container = document.querySelector('.preview-large')


	// Find the wanted player by iterating the data object and searching for the chosen index.
	if (players.length) {
		players.forEach(function (player) {
			if (player.id == index) {
				// Populate '.preview-large' with the chosen player's data.
				container.querySelector('h3').textContent = player.name;
				container.querySelector('img').setAttribute('src', player.image.large);
				container.querySelector('p').textContent = player.description;
			}
		});
	}

	// Show the page.
	if (page.classList) {
		page.classList.add('visible');
	} else {
			page.className += ' visible';
	}
}

// Find and render the filtered data results. Arguments are:
// filters - our global variable - the object with arrays about what we are searching for.
// players - an object with the full players list (from player.json).
function renderFilterResults(filters, players) {

		// This array contains all the possible filter criteria.
	var criterias = ['team','position','dribbling','pace', 'defense', 'shooting', 'passing', 'physical', 'flair'];

	// Uncheck all the checkboxes.
	// We will be checking them again one by one.
	checkboxes.forEach(function(checkbox) {
		checkbox.checked = false;
	});

	sliders.forEach(function(slider) {
		slider.value = 0;
	})

	if (isFiltered  && (!filters['team'] || !filters['position'])) {
		players = originalPlayersList;
		results = originalPlayersList;
	}
	
	criterias.forEach(function (criteria) {

		// Check if each of the possible filter criteria is actually in the filters object.
		if (filters[criteria] && filters[criteria].length) {
			// After we've filtered the players once, we want to keep filtering them.
			// That's why we make the object we search in (players) to equal the one with the results.
			// Then the results array is cleared, so it can be filled with the newly filtered data.
			if (isFiltered) {
				players = results;
				results = [];
			}
			// In these nested 'for loops' we will iterate over the filters and the players
			// and check if they contain the same values (the ones we are filtering by).
			// Iterate over the entries inside filters.criteria (remember each criteria contains an array).
			filters[criteria].forEach(function (filter) {
				// Iterate over the players.
				players.forEach(function (player) {
					// If the player has the same specification value as the one in the filter
					// push it inside the results array and mark the isFiltered flag true.
					if (typeof player.specs[criteria] == 'number') {
						if (player.specs[criteria] == filter) {
							results.push(player);
							isFiltered = true;
						}
					}
					if (typeof player.specs[criteria] == 'string') {
						filter = filter.split('-').join(' ');
						if (player.specs[criteria].indexOf(filter) != -1) {
							results.push(player);
							isFiltered = true;
						}
					}

				});

				// Here we can make the checkboxes representing the filters true,
				// keeping the app up to date.
				if (criteria && filter) {
					if (criteria === 'team' || criteria === 'position' || criteria === 'flair') {
						if ('12345'.includes(filter)) {
							filter = '"'+filter+'"'
						}
						filter = filter.split(' ').join('-');
						var checkboxOfFiltersSelection = document.querySelector('input[name='+criteria+'][value='+filter+']');
						checkboxOfFiltersSelection.checked = true;
					} else {
						var sliderOfFiltersSelection = document.querySelector('input[name='+criteria+']');
						sliderOfFiltersSelection.value = filter;
					}
				}	
			});
		}

	});

	// Call the renderPlayersPage.
	// As it's argument give the object with filtered players.

	renderPlayersPage(results);
}


// Shows the error page.
function renderErrorPage() {
	var page = document.querySelector('.error');
	if (page.classList) {
		page.classList.add('visible');
	} else {
		page.className += ' visible';
	}
}

// Get the filters object, turn it into a string and write it into the hash.
function createQueryHash(filters){

	// Here we check if filters isn't empty.
	function isEmptyObject(obj) {
		return Object.keys(obj).length === 0;
	}

	if (!isEmptyObject(filters)) {
		// Stringify the object via JSON.stringify and write it after the '#filter' keyword.
		window.location.hash = '#filter/' + JSON.stringify(filters);
	}
	else {
		// If it's empty change the hash to '#' (the homepage).
		window.location.hash = '#';
		isFiltered = false;
		results = [];
	}

}
