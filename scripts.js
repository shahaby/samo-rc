/**
 * Santa Monica Rent Control Catalog
 *
 * The city of Santa Monica's Rent Control Board maintains a publicly accessible
 * database of rent controlled properties in the city at 
 * https://www.smgov.net/departments/rentcontrol/mar.aspx
 * 
 * The interface is very limited and only allows for looking up units in an
 * individual building with an interface that leaves much to be desired.
 * 
 * I have scraped the data using a python script and stored it in a CSV
 * dataset which is stored locally in the root of this project.
 * 
 * This project is aimed at bringing the data to life and allowing for
 * better visualization, and more interaction with the data.
 * 
 **/

let units = []; // Placeholder array for parsed dataset of units
let cards = []; // Placeholder array for filtered units
let currentPage = 1; // Defaulting current page to 1
let cardsPerPage = 10; // Number of cards to display per page
let selectedBeds = []; // Placeholder array for filtering based on beds
let faveUnits = []; // Placeholder array for storing fave units
const Home_Image_URL = "./pexels-binyaminmellish-106399.jpg";
// const savedButt = document.getElementById("saved-units");

fetch('units.csv')
    .then(response => response.text())
    .then(data => {
        units = parseCSV(data); // Process the CSV data
        cards = units; // Copy to cards for filtering
        //console.log(units.length);
        shuffleCards(); // Shuffle the units initially for better ux
        showCards(currentPage); // Show cards once data is fetched and parsed
    })
    .catch(error => {
        console.error('An error occured while fetching the CSV file:', error);
    });

function parseCSV(csv) {
  const lines = csv.split('\n'); // Split each line
  const result = []; // Array to store dataset
  const headers = lines[0].split(','); // First row aka the header to use as keys

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
    
    // Loop fields in row and update obj keys
    for (let j = 0; j < headers.length; j++) {
      const value = values[j];
      obj[headers[j]] = value;
    }

    // Push new row object to array
    result.push(obj);
  }

  return result;
}


// Func to display cards
function showCards(page) {
  cardsPerPage = parseInt(document.getElementById("units-per-page")?.value) || cardsPerPage;

  const unitsCount = document.getElementById("units-count");
  unitsCount.textContent = addCommas(cards.length);

  const cardContainer = document.getElementById("card-container");
  cardContainer.innerHTML = "";
  const templateCard = document.querySelector(".card");

  const start = (page - 1) * cardsPerPage;
  const end = start + cardsPerPage;
  const paginatedCards = cards.slice(start, end);
  // console.log("start = " + start + " | end = " + end + " | cardsPerPage = " + cardsPerPage);

  for (let i = 0; i < paginatedCards.length; i++) {
    let unit = paginatedCards[i];
    let cardID = sanitizeId(unit["Address"]+unit["Unit"]) // Element ID for the card image

    let imageURL = Home_Image_URL;
    imageURL = 'https://yarmohammadi.com/samo-rc/streetview/?address=' + unit["Address"] + ', Santa Monica, CA'

    const nextCard = templateCard.cloneNode(true); // Copy the template card
    editCardContent(nextCard
      , unit["Address"] + (unit["Unit"] ? ' #' + unit["Unit"] : '')
      , imageURL, unit["MAR"], unit["Bedrooms"], unit["Date"]
      , cardID); // Edit title and image
    cardContainer.appendChild(nextCard); // Add new card to the container
  }

  updatePaginationControls();
}

// Func to update pagination controls
function updatePaginationControls() {
  const totalPages = Math.ceil(cards.length / cardsPerPage);
  document.getElementById("prev-page").disabled = currentPage == 1;
  document.getElementById("next-page").disabled = currentPage == totalPages;

  const pageNumbersContainer = document.getElementById("page-numbers");
    pageNumbersContainer.innerHTML = ""; // Clear existing page numbers

    for (let i = 1; i <= totalPages; i++) {
      if (i == 1 || i == totalPages || (i <= currentPage + 3 && i >= currentPage - 3)){
        const pageNumber = document.createElement("span");
        pageNumber.textContent = addCommas(i);
        pageNumber.classList.add("page-number");
        pageNumber.style.margin = "0 5px"; // Add space

        if (i != currentPage){
          pageNumber.style.cursor = "pointer";
          // Add click event to each page no
          pageNumber.addEventListener("click", () => {
              currentPage = i;
              showCards(currentPage);
          });
        }

        pageNumbersContainer.appendChild(pageNumber);
      } else if (i == currentPage + 5 || i == currentPage - 5)
      {
        const pageNumber = document.createElement("span");
        pageNumber.textContent = "...";
        pageNumbersContainer.appendChild(pageNumber);
      }
    }
}

// prevPage butt onClick Listener
function prevPage(){
  if (currentPage > 1) {
    currentPage--;
    showCards(currentPage);
    console.log(currentPage);
  }
}

// nextPage butt onClick Listener
function nextPage(){
  const totalPages = Math.ceil(cards.length / cardsPerPage);
  if (currentPage < totalPages) {
    currentPage++;
    showCards(currentPage);
    console.log(currentPage);
  }
}

// Func to template new cards
function editCardContent(card, newTitle, newImageURL, newPrice, newBeds, newDate, newID) {
  card.style.display = "block";

  const cardHeader = card.querySelector("h2");
  cardHeader.textContent = newTitle;

  const bullets = card.querySelectorAll("li");
  bullets[0].textContent = '$' + addCommas(newPrice) + ".00 | ";
  bullets[1].textContent = newBeds == 0 ? "Studio" : newBeds + " beds";
  newDate = newDate ? " | " + new Date(newDate).toDateString().slice(4) : ""
  bullets[2].textContent = newDate;

  const cardImage = card.querySelector("img");
  cardImage.src = newImageURL;
  cardImage.alt = newTitle + " Poster";
  cardImage.id = newID;

  const cardMapLink = card.querySelector("a");
  cardMapLink.href = "https://maps.google.com/?q=" + encodeURIComponent(newTitle + ", Santa Monica, CA");
  
  const favIcon = card.querySelector("span");
  //pageNumber.style.cursor = "pointer";
  if (faveUnits.includes(newTitle)){
    favIcon.classList.add("selected");
  }
  // Add click event to each star icon
  favIcon.addEventListener("click", () => {
      //this.classList.toggle('selected');
      if (faveUnits.includes(newTitle)){
        faveUnits = faveUnits.filter(item=>item!=newTitle);
        if (document.getElementById("saved-units").classList.contains("on")){
          card.remove();
          //Add code to update no. of units after card removal
        }
      } else {
        faveUnits.push(newTitle);
      }
      console.log(faveUnits);
      document.getElementById('saved-units').textContent = "★ Saved (" + faveUnits.length + ")";
  });

}

// Func to reset filter controls
function resetCards() {
  document.getElementById("search-query").value = '';
  document.getElementById("min-price").value = '';
  document.getElementById("max-price").value = '';

  selectedBeds.length = 0;
  for (let i=0;i<=4;i++){
    const myButton = document.getElementById("toggle" + i);
    myButton.classList.remove("on");
    myButton.classList.add("off");
  }
  const myButton = document.getElementById("saved-units");
  myButton.classList.remove("on")

  filterCards();
}

// Func to filter cards array based on active filter controls
function filterCards() {
  const showSaved = document.getElementById("saved-units").classList.contains("on");
    let minPrice = parseInt(document.getElementById("min-price").value) || 0;
    let maxPrice = parseInt(document.getElementById("max-price").value) || 9999999;
    maxPrice = maxPrice > minPrice ? maxPrice : 9999999; // Set maxPrice to 9999999 if it's not greater than minPrice for better UX
    let searchQuery = document.getElementById("search-query").value.toUpperCase();

    //console.log(`search query = ${searchQuery}
    //   | min = ${minPrice} | max = ${maxPrice} | beds = ${selectedBeds}`);
    
    cards = units.filter(unit => parseInt(unit.MAR) > minPrice 
            && parseInt(unit.MAR) < parseFloat(maxPrice) 
            && unit.Address.includes(searchQuery)
            && (selectedBeds.length === 0 || selectedBeds.some(bed => {
              if (bed == 4) // Special condition for 4+ button
              {
                return unit.Bedrooms >= 4;
              }
              return unit.Bedrooms == bed;
            }))
            && (showSaved === false || faveUnits.length === 0 || faveUnits.includes(unit.Address + (unit.Unit ? ' #' + unit.Unit : '')))
          );

  // Sort the array based on user selection
  const sortby = document.getElementById("sort-cards").value;
  switch (sortby) {
    case "price-asc":
      cards = cards.sort((a,b) => a.MAR - b.MAR);
      break;
    case "price-desc":
      cards = cards.sort((a,b) => b.MAR - a.MAR);
      break;
    case "beds-asc":
      cards = cards.sort((a,b) => a.Bedrooms - b.Bedrooms);
      break;
    case "beds-desc":
      cards = cards.sort((a,b) => b.Bedrooms - a.Bedrooms);
      break;
    case "date-asc":
      cards = cards.sort((a,b) => 
        (a.Date ? new Date(a.Date) : new Date('1/1/1800')) - (b.Date ? new Date(b.Date) : new Date('1/1/1800')));
      break;
    case "date-desc":
      cards = cards.sort((a,b) => 
        (b.Date ? new Date(b.Date) : new Date('1/1/1800')) - (a.Date ? new Date(a.Date) : new Date('1/1/1800')));
      break;
    default:
      // Don't sort!
  }

  const totalPages = Math.ceil(cards.length / cardsPerPage);
  showCards(currentPage <= totalPages ? currentPage : totalPages);
}

// Toggle saved units butt
function toggleSaved() {
  const myButton = document.getElementById("saved-units");
  myButton.classList.toggle('on');
  filterCards();
}

// Toggle bed butts
function toggleBeds(arg) {
  const myButton = document.getElementById("toggle" + arg);
    
  // Toggle the class and text based on the current state
  if (myButton.classList.contains("off")) {
    myButton.classList.remove("off");
    myButton.classList.add("on");
    selectedBeds.push(arg);
  } else {
    myButton.classList.remove("on");
    myButton.classList.add("off");
    selectedBeds = selectedBeds.filter(item => item != arg);
  }

  filterCards();
}

// Shuffle cards randomly
function shuffleCards() {
  shuffleArray(cards);
  showCards(currentPage); // Call showCards again to refresh
}

// Fisher-Yates algorithm to shuffle an array randomly
function shuffleArray(array) {
  for (let i = array.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [array[i], array[j]] = [array[j], array[i]]; // Swap elements
  }
  return array;
}

// Func to Replace invalid HTML element id characters with a hyphen
function sanitizeId(arg) {
  return arg.replace(/[^a-zA-Z0-9-_:\.]/g, '-');
}

// Func to add commas w/ regex for better readability
function addCommas(arg){
  return String(arg).replace(/\B(?=(\d{3})+(?!\d))/g, ",");
}

function disclaimerAlert() {
  alert(
    "Disclaimer: This web app is for informational purposes only. The information provided is not guaranteed to be accurate, complete, or up-to-date. Use at your own risk. We are not responsible for any errors or omissions, or for any outcomes related to the use of this app. By using this app, you agree to these terms."
  );
}