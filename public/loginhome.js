
// Simulated function to fetch geological disaster data
function fetchGeologicalDisasters(startDate, endDate) {
    return new Promise((resolve) => {
        setTimeout(() => {
            resolve([
                { date: "2023-01-15", type: "Flood", location: "Location 1" },
                { date: "2023-01-20", type: "Landslide", location: "Location 2" },
            ]);
        }, 1000);
    });
}


function initGeologicalDisasterBtn() {
  document.getElementById("geologicalDisasterBtn").addEventListener("click", function () {
      var content = document.getElementById("geologicalDisasterContent");
      if (content.style.display === "none" || content.style.display === "") {
          content.style.display = "block";
      } else {
          content.style.display = "none";
      }
  });
}

window.addEventListener("load", initGeologicalDisasterBtn);

function fetchCountries() {
    fetch("https://restcountries.com/v3.1/all")
        .then((response) => response.json())
        .then((countries) => {
            var countryDropdown = document.querySelector(".dropdown2 .dropdown-content");


            countries.forEach((country) => {
                var option = document.createElement("p");
                option.classList.add("country-option");
                option.textContent = country.name.common;
                option.setAttribute("data-lat", country.latlng[0]);
                option.setAttribute("data-lng", country.latlng[1]);
                countryDropdown.appendChild(option);
            });

            // Add event listeners to the country options
            var countryOptions = document.querySelectorAll(".country-option");
            countryOptions.forEach(function (option) {
                option.addEventListener("click", function () {
                    var lat = parseFloat(this.getAttribute("data-lat"));
                    var lng = parseFloat(this.getAttribute("data-lng"));
                    map.setView([lat, lng], 6);
                });
            });
        });
}

function initFetchCountries() {
  fetchCountries();
}

window.addEventListener("load", initFetchCountries);



// Get the dropdown container
var dropdownContainer = document.querySelector('.dropdown2 .dropdown-content');

// Get all the country options
var countryOptions = document.querySelectorAll('.country-option');





