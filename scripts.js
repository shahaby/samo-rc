/**
 * Santa Monica Rent Control Catalog
 *
 * The city of Santa Monica's Rent Control Board maintains a public database
 * of rent controlled properties in the city at 
 * https://www.smgov.net/departments/rentcontrol/mar.aspx
 * 
 * The interface is very limited and allows for looking up units in an
 * individual building with an interface that leaves much to be desired.
 * 
 * I have scraped the data using a python script and stored it in a CSV
 * datased which is stored locally in the root of this project.
 * 
 * This project is aimed at bringing the data to life and allowing for
 * better visualization, and more interaction with the data.
 * 
 */


let units = []; // Placeholder array for the parsed dataset of units
let currentPage = 1; // Defaulting current page to 1
const cardsPerPage = 10; // Number of cards to display per page

// WARNING!!! Storing your API key here will expose it to viewers
// If you are not using locally you must restrict domain, referer, and set limits
const apiKey = "YOUR_API_KEY_GOES_HERE"; // Enter your Google Maps API key here. 

fetch('units.csv')
    .then(response => response.text())
    .then(data => {
        // Process the CSV data
        units = parseCSV(data);
        //console.log(units);
        shuffleCards(); // Shuffle the units initially
        // Calls showCards() func once data is fetched and parsed
        showCards(currentPage);
    })
    .catch(error => {
        console.error('An error occured while fetching the CSV file:', error);
    });

function parseCSV(csv) {
  const lines = csv.split('\n'); // Split each line of data
  const result = []; // Array to store dataset
  const headers = lines[0].split(',').map(header => header.trim()); // First row aka the header to use as keys

  // Loop through each line after header
  for (let i = 1; i < lines.length; i++) {
    const obj = {}; // Object to hold contents of each row/line
    let currentline = lines[i];
    const values = []; // Array to hold values
    let inQuotes = false; // Is value in quotation marks?
    let currentValue = '';

    // Escaping quotation marks
    for (let char of currentline) {
        if (char === '"') {
            // Flip quotation mark flag
            inQuotes = !inQuotes;
        } else if (char === ',' && !inQuotes) {
            // End of field, push value to array
            values.push(currentValue.trim());
            currentValue = '';
        } else {
            // Read next character
            currentValue += char;
        }
      }

    // Push the last value
    values.push(currentValue.trim());
    
    // Loop thorugh values of row
    for (let j = 0; j < headers.length; j++) {
      // Replace leading and/or trailing double quotes
      const value = values[j] ? values[j].replace(/^"|"$/g, '').trim() : '';
      // Update object value
      obj[headers[j]] = value;
    }

    // Push new row object to array
    result.push(obj);
  }

  return result;
}

const Home_Image_URL = "./pexels-binyaminmellish-106399.jpg";


// This function adds cards to the page to display the data in the array
function showCards(page) {
  const cardContainer = document.getElementById("card-container");
  cardContainer.innerHTML = "";
  const templateCard = document.querySelector(".card");

  const start = (page - 1) * cardsPerPage;
  const end = start + cardsPerPage;
  const paginatedUnits = units.slice(start, end);

  for (let i = 0; i < paginatedUnits.length; i++) {
    let unit = paginatedUnits[i];
    let cardID = sanitizeId(unit["Address"]+unit["Unit"])

    let imageURL = Home_Image_URL;
    // Get Streetview Image from Google Maps
    getLatLng(unit["Address"] + ', Santa Monica, CA')
    .then(latLng => {
      //streetViewUrl
      const imageURL = `https://maps.googleapis.com/maps/api/streetview?size=600x400&location=${latLng}&key=${apiKey}`;
      document.getElementById(cardID).src = imageURL;
    })
    .catch(error => {
      console.error(error);
    });

    const nextCard = templateCard.cloneNode(true); // Copy the template card
    editCardContent(nextCard
      , unit["Address"] + (unit["Unit"] ? ' #' + unit["Unit"] : '')
      , imageURL, unit["MAR"], cardID); // Edit title and image
    cardContainer.appendChild(nextCard); // Add new card to the container
  }

  updatePaginationControls();
}

// Func to update pagination controls
function updatePaginationControls() {
  const totalPages = Math.ceil(units.length / cardsPerPage);
  document.getElementById("prev-page").disabled = currentPage === 1;
  document.getElementById("next-page").disabled = currentPage === totalPages;
}

// Load these last to avoid not picking up the elements before rendering
document.addEventListener("DOMContentLoaded", function() {

  // Event listeners for pagination controls
  document.getElementById("prev-page").addEventListener("click", () => {
    if (currentPage > 1) {
      currentPage--;
      showCards(currentPage);
    }
  });

  document.getElementById("next-page").addEventListener("click", () => {
    const totalPages = Math.ceil(units.length / cardsPerPage);
    if (currentPage < totalPages) {
      currentPage++;
      showCards(currentPage);
    }
  });
});

function editCardContent(card, newTitle, newImageURL, newPrice, newID) {
  card.style.display = "block";

  const cardHeader = card.querySelector("b");
  cardHeader.textContent = newTitle;

  const cardPrice = card.querySelector("i");
  cardPrice.textContent = newPrice;

  const cardImage = card.querySelector("img");
  cardImage.src = newImageURL;
  cardImage.alt = newTitle + " Poster";
  cardImage.id = newID;

}

// This calls the addCards() function when the page is first loaded
//document.addEventListener("DOMContentLoaded", showCards);

function shuffleCards() {
  units = units.filter(unit => unit.Bedrooms <= 1);
  shuffleArray(units);
  //console.log(units);
  //units.pop(); // Remove last unit in units array
  showCards(currentPage); // Call showCards again to refresh
}

function quoteAlert() {
  console.log("Button Clicked!");
  alert(
    "I guess I can kiss heaven goodbye, because it got to be a sin to look this good!"
  );
}

// Fisher-Yates algorithm to shuffle an array randomly
function shuffleArray(array) {
  for (let i = array.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [array[i], array[j]] = [array[j], array[i]]; // Swap elements
  }
  return array;
}

async function getLatLng(address) {
  const response = await fetch(`https://maps.googleapis.com/maps/api/geocode/json?address=${encodeURIComponent(address)}&key=${apiKey}`);
  const data = await response.json();
  if (data.results && data.results[0]) {
    const location = data.results[0].geometry.location;
    return `${location.lat},${location.lng}`;
  } else {
    throw new Error('Address not found');
  }
}

// Func to Replace invalid HTML element id characters with a hyphen
function sanitizeId(arg) {
  return arg.replace(/[^a-zA-Z0-9-_:\.]/g, '-');
}