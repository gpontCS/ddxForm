const dateInput = document.querySelector("#date");
const collectionName = "DG Loads On Hand";
let documentID;

loadsonhandwetElement = document.querySelector("#loadsonhandwet");
loadsonhanddryElement = document.querySelector("#loadsonhanddry");

async function saveId(selectedDate) {
  documentID = undefined;
  console.log(selectedDate);
  try {
    filter = { "content.Date": { $eq: selectedDate } };
    console.log(filter);
    const result = await domo.post(`/domo/datastores/v1/collections/${collectionName}/documents/query`, filter);
    console.log(result);
    //check if data already exists in collection for the selected date
    if (result.length > 0) {
      //if exists, save the corresponding documentID
      documentID = result[0].id;
      console.log(documentID);
    } else {
      //if does not exist, leave documentID undefined
      documentID = undefined;
      console.log(documentID);
    }
  } catch (error) {
    console.log(error);
  }
}

async function setValues(selectedDate) {
  try {
    filter = { "content.Date": { $eq: selectedDate } };
    const result = await domo.post(`/domo/datastores/v1/collections/${collectionName}/documents/query`, filter);
    //check if data already exists in collection for the selected date
    if (result.length > 0) {
      //if exists, populate form with the existing values
      loadsonhandwetElement.value = result[0].content.LoadsOnHand_Wet;
      loadsonhanddryElement.value = result[0].content.LoadsOnHand_Dry;
    } else {
      //if does not exist, populate form with 0 measurement values
      loadsonhandwetElement.value = 0;
      loadsonhanddryElement.value = 0;
    }
  } catch (error) {
    console.log(error);
  }
}

async function submitForm() {
  event.preventDefault(); //prevents form submission for the default value

  const date = document.querySelector("#date").value;
  const loadsonhandwet = document.querySelector("#loadsonhandwet").value;
  const loadsonhanddry = document.querySelector("#loadsonhanddry").value;
  //create variable for the submit button activity
  const submit = document.querySelector("#submit");
  //change color & text of Submit button after click - visible queue that
  submit.disabled = true; //disables button while collection is updating with captured values
  submit.classList.remove("bg-[#5d7261]"); //removes the default color for the submit button
  submit.classList.add("bg-[#dae1db]"); //changes color of submit button to a lighter shade
  submit.innerText = "Submitting"; //changes text from Submit to Submitting

  await saveId(date);

  console.log("submit");
  console.log(documentID);
  let data = { content: { Date: date, LoadsOnHand_Wet: loadsonhandwet, LoadsOnHand_Dry: loadsonhanddry } };
  //send updated data to the collection
  if (documentID) {
    domo.put(`/domo/datastores/v1/collections/${collectionName}/documents/${documentID}`, data);
  }
  if (!documentID) {
    domo.put(`/domo/datastores/v1/collections/${collectionName}/documents/`, data);
  }

  setTimeout(() => {
    domo.post(`domo/datastores/v1/export?includeRelatedCollections`);
  }, 1500); //sets timeout for updating the dataset to 1.5 seconds
  setTimeout(() => {
    //reset Submit button display after the collection has been updated
    submit.disabled = false; //reactivates the Submit button
    submit.classList.remove("bg-[#dae1db]"); //removes the light shade color for the submit button
    submit.classList.add("bg-[#5d7261]"); //returns submit button to default color
    submit.innerText = "Submit"; //changes text back to Submit
  }, 1500);
}

function setDate() {
  //const dateInput = document.querySelector("#date");

  //set default value for Report Date to today
  const today = new Date();
  const yesterday = new Date(today.getTime() - 24 * 60 * 60 * 1000);
  const defaultdate = yesterday.toISOString().substr(0, 10); //declare constant with default date in yyyy-mm-dd format
  dateInput.value = defaultdate;
  saveId(defaultdate);
  setValues(defaultdate);
}

setDate();
let selectedDate;

dateInput.addEventListener("change", async function (event) {
  selectedDate = event.target.value;
  console.log("change" + selectedDate);
  await setValues(selectedDate);
});

function createCollection() {
  collection = {
    name: collectionName,
    schema: {
      columns: [
        { name: "Date", type: "DATE" },
        { name: "LoadsOnHand_Wet", type: "LONG" },
        { name: "LoadsOnHand_Dry", type: "LONG" },
      ],
    },
    syncEnabled: true,
  };

  domo.post(`/domo/datastores/v1/collections`, collection).then((data) => console.log(data));
}
//Run this only once to create the collection.  Note: Run on 2023-06-23
//createCollection();

//Use this function to add historical records to the collection
function addHistorical() {
  let json = [];

  domo.post(`/domo/datastores/v1/collections/${collectionName}/documents/bulk`, json).then((data) => console.log(data));
}
//addHistorical();  //uncommment to load historical records

//List documents in collection
const listDocuments = () => {
  domo
    .get(`/domo/datastores/v1/collections/${collectionName}/documents/`)
    .then((data) => {
      documentList = data;
      console.log(documentList); //parseFiltersFromAppDB()
      deleteAllDocuments(documentList);
    })
    .catch((error) => console.log(error));
};

//delete all documents in collection
const deleteAllDocuments = (documentList) => {
  documentList.forEach((item) => {
    domo.delete(`/domo/datastores/v1/collections/${collectionName}/documents/${item.id}`);
  });
};

//listDocuments();  //DO NOT UNCOMMENT!!, uncomment ONLY if want to delete the entire collection

const myButton = document.getElementById("submit");
myButton.addEventListener("click", submitForm); // Add event listener
