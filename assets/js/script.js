$(function () {

	// Globals variables

		// 	An array containing objects with information about the players.
	var players = [],

		// Our filters object will contain an array of values for each filter

		// Example:
		// filters = {
		// 		"manufacturer" = ["Apple","Sony"],
		//		"storage" = [16]
		//	}
		filters = {};


	//	Event handlers for frontend navigation

	//	Checkbox filtering

	var checkboxes = $('.all-players input[type=checkbox]');

	checkboxes.click(function () {

		var that = $(this),
			specName = that.attr('name');

		// When a checkbox is checked we need to write that in the filters object;
		if(that.is(":checked")) {

			// If the filter for this specification isn't created yet - do it.
			if(!(filters[specName] && filters[specName].length)){
				filters[specName] = [];
			}

			//	Push values into the chosen filter array
			filters[specName].push(that.val());

			// Change the url hash;
			createQueryHash(filters);

		}

		// When a checkbox is unchecked we need to remove its value from the filters object.
		if(!that.is(":checked")) {

			if(filters[specName] && filters[specName].length && (filters[specName].indexOf(that.val()) != -1)){

				// Find the checkbox value in the corresponding array inside the filters object.
				var index = filters[specName].indexOf(that.val());

				// Remove it.
				filters[specName].splice(index, 1);

				// If it was the last remaining value for this specification,
				// delete the whole array.
				if(!filters[specName].length){
					delete filters[specName];
				}

			}

			// Change the url hash;
			createQueryHash(filters);
		}
	});

	// When the "Clear all filters" button is pressed change the hash to '#' (go to the home page)
	$('.filters button').click(function (e) {
		e.preventDefault();
		window.location.hash = '#';
	});


	// Single player page buttons

	var singlePlayerPage = $('.single-player');

	singlePlayerPage.on('click', function (e) {

		if (singlePlayerPage.hasClass('visible')) {

			var clicked = $(e.target);

			// If the close button or the background are clicked go to the previous page.
			if (clicked.hasClass('close') || clicked.hasClass('overlay')) {
				// Change the url hash with the last used filters.
				createQueryHash(filters);
			}

		}

	});


	// These are called on page load

	// Get data about our players from players.json.
	$.getJSON( "players.json", function( data ) {

		// Write the data into our global variable.
		players = data;

		// Call a function to create HTML for all the players.
		generateAllPlayersHTML(players);

		// Manually trigger a hashchange to start the app.
		$(window).trigger('hashchange');
	});


	// An event handler with calls the render function on every hashchange.
	// The render function will show the appropriate content of out page.
	$(window).on('hashchange', function(){
		render(decodeURI(window.location.hash));
	});


	// Navigation

	function render(url) {

		// Get the keyword from the url.
		var temp = url.split('/')[0];

		// Hide whatever page is currently shown.
		$('.main-content .page').removeClass('visible');


		var	map = {

			// The "Homepage".
			'': function() {

				// Clear the filters object, uncheck all checkboxes, show all the players
				filters = {};
				checkboxes.prop('checked',false);

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
				url = url.split('#filter/')[1].trim();

				// Try and parse the filters object from the query string.
				try {
					filters = JSON.parse(url);
				}
					// If it isn't a valid json, go back to homepage ( the rest of the code won't be executed ).
				catch(err) {
					window.location.hash = '#';
					return;
				}

				renderFilterResults(filters, players);
			}

		};

		// Execute the needed function depending on the url keyword (stored in temp).
		if(map[temp]){
			map[temp]();
		}
		// If the keyword isn't listed in the above - render the error page.
		else {
			renderErrorPage();
		}

	}


	// This function is called only once - on page load.
	// It fills up the players list via a handlebars template.
	// It recieves one parameter - the data we took from players.json.
	function generateAllPlayersHTML(data){

		console.log("hello");

		var list = $('.all-players .players-list');

		var theTemplateScript = $("#players-template").html();
		//Compile the template​
		var theTemplate = Handlebars.compile(theTemplateScript);
		list.append(theTemplate(data));


		// Each players has a data-index attribute.
		// On click change the url hash to open up a preview for this player only.
		// Remember: every hashchange triggers the render function.
		list.find('li').on('click', function (e) {
			e.preventDefault();

			var playerIndex = $(this).data('index');

			window.location.hash = 'player/' + playerIndex;
		})
	}

	// This function receives an object containing all the player we want to show.
	function renderPlayersPage(data){

		var page = $('.all-players'),
			allPlayers = $('.all-players .players-list > li');

		// Hide all the players in the players list.
		allPlayers.addClass('hidden');

		// Iterate over all of the players.
		// If their ID is somewhere in the data object remove the hidden class to reveal them.
		allPlayers.each(function () {

			var that = $(this);

			data.forEach(function (item) {
				if(that.data('index') == item.id){
					that.removeClass('hidden');
				}
			});
		});

		// Show the page itself.
		// (the render function hides all pages so we need to show the one we want).
		page.addClass('visible');

	}


	// Opens up a preview for one of the players.
	// Its parameters are an index from the hash and the players object.
	function renderSinglePlayerPage(index, data){

		var page = $('.single-player'),
			container = $('.preview-large');

		// Find the wanted player by iterating the data object and searching for the chosen index.
		if(data.length){
			data.forEach(function (item) {
				if(item.id == index){
					// Populate '.preview-large' with the chosen player's data.
					container.find('h3').text(item.name);
					container.find('img').attr('src', item.image.large);
					container.find('p').text(item.description);
				}
			});
		}

		// Show the page.
		page.addClass('visible');

	}

	// Find and render the filtered data results. Arguments are:
	// filters - our global variable - the object with arrays about what we are searching for.
	// players - an object with the full players list (from player.json).
	function renderFilterResults(filters, players){

			// This array contains all the possible filter criteria.
		var criteria = ['team','position','dribbling','pace', 'defense', 'shooting', 'passing', 'physical', 'flair'],
			results = [],
			isFiltered = false;

		// Uncheck all the checkboxes.
		// We will be checking them again one by one.
		checkboxes.prop('checked', false);


		criteria.forEach(function (c) {

			// Check if each of the possible filter criteria is actually in the filters object.
			if(filters[c] && filters[c].length){


				// After we've filtered the players once, we want to keep filtering them.
				// That's why we make the object we search in (players) to equal the one with the results.
				// Then the results array is cleared, so it can be filled with the newly filtered data.
				if(isFiltered){
					players = results;
					results = [];
				}


				// In these nested 'for loops' we will iterate over the filters and the players
				// and check if they contain the same values (the ones we are filtering by).

				// Iterate over the entries inside filters.criteria (remember each criteria contains an array).
				filters[c].forEach(function (filter) {

					// Iterate over the players.
					players.forEach(function (item){

						// If the player has the same specification value as the one in the filter
						// push it inside the results array and mark the isFiltered flag true.

						if(typeof item.specs[c] == 'number'){
							if(item.specs[c] == filter){
								results.push(item);
								isFiltered = true;
							}
						}

						if(typeof item.specs[c] == 'string'){
							if(item.specs[c].toLowerCase().indexOf(filter) != -1){
								results.push(item);
								isFiltered = true;
							}
						}

					});

					// Here we can make the checkboxes representing the filters true,
					// keeping the app up to date.
					if(c && filter){
						$('input[name='+c+'][value='+filter+']').prop('checked',true);
					}
				});
			}

		});

		// Call the renderPlayersPage.
		// As it's argument give the object with filtered players.
		renderPlayersPage(results);
	}


	// Shows the error page.
	function renderErrorPage(){
		var page = $('.error');
		page.addClass('visible');
	}

	// Get the filters object, turn it into a string and write it into the hash.
	function createQueryHash(filters){

		// Here we check if filters isn't empty.
		if(!$.isEmptyObject(filters)){
			// Stringify the object via JSON.stringify and write it after the '#filter' keyword.
			window.location.hash = '#filter/' + JSON.stringify(filters);
		}
		else{
			// If it's empty change the hash to '#' (the homepage).
			window.location.hash = '#';
		}

	}

});