// --- ES6 qustions
const fs = require('fs');


// --- Command Line Interface CLI libraries, not required but, I wanted to up the cute content
const chalk       = require('chalk');
const clear       = require('clear');
const figlet      = require('figlet');
const inquirer    = require('inquirer');

// --- Simplified reading a file directly without moving it all into a string
//     these out files can be huge
const lineReader = require('line-reader');



let answers = Object;       // --- Object to hold 'answers' from 'inquirer'
let outText = "";           // --- OUT file string
let csvFile = "rout.csv"    // --- Standard file name for CSV

// ---


/*************************************
 * Functions                         *
 ************************************/

// --- Process the outText, core of code
function processOutText(answers){
  // --- extract file name
  var outFile = answers.fileName;
  var beneID = "";
  var timeIS = "04/09/19 7:52:11 AM";
  var request = "HelloWorld";
  var count = 0;
  var nextLineTime = false ; // --- Used to get next line after a request line
  var csvLine = "";
  console.log(`-- File ${outFile} being processed`);
  // --- Create CSV file write header
  try {
    header = "RunID,Server,Environment,RunnerType,Run-Date,Bene-ID,Request";
    const data = fs.writeFileSync(csvFile, header);
  } catch (err) {
    console.log(`***** Unable to write to "rout.csv"`);
  }

  // --- Read each line
  lineReader.eachLine(outFile, function(line,last){
    // --- Process the line look for beneID
    if(line.substr(0,3) == '*--'  && !nextLineTime){
      // --- Got a bene id

      // --- Create bene abbrev  ie: 0187234936  {839}
      beneID = `{${line.substr(6,1)}${line.substr(9,1)}${line.substr(11,1)}}`
      count++;
      console.log(`-- Bene # ${count} - ${beneID}, scanning requests`);
    } else {
      // -- process line look for request `** `
      if(line.substr(0,3) == "** " && !nextLineTime){
        // -- Got a request, pull out request name  ie summary API = summary
        request = line.substr(3);
        request = request.substr(0,request.length-4); 
        nextLineTime = true;      
      }  else {
        if(nextLineTime){
          // --- get the date ie Mon, Apr 08, 2019  3:00:09 PM - Apr 08, 2019  3:00:09 PM
          timeIS = line.substr(5);
          console.log(`--- Request: ${request} at ${timeIS}`);
          nextLineTime = false;
        } else {
          // --- look for the `ErrorID`
          if(line.indexOf("ErrorID") > 0 ){
            console.log('---- Error');
            // Write a row out
            csvLine = `\n${answers.runID},${answers.server},${answers.environment},${answers.runnerType},${timeIS},${beneID},${request}`
            fs.appendFile(csvFile, csvLine, (err) => {
              if(err){
                console.log(`***** Unable to append to "rout.csv"`)
                return
              }
            })
          }
        }
      }
    };  
    if(last){
      console.log(`-- File processed.`);
      console.log('Press any key to exit');
      process.stdin.setRawMode(true);
      process.stdin.resume();
      process.stdin.on('data', process.exit.bind(process, 0));
     };
  })
}


/**************************************
 * Let's get started                  * 
 **************************************/

 // --- Heading
 clear();
 console.log( chalk.yellow(figlet.textSync('ROUT2CSV', {horizontalLayout: 'full'})));
 console.log("Version 2.1b 04/08/2019");
 console.log("");


// --- Get the name of a single OUT file to process from those file in the current directory
// --- Array for list of *.out files
const outFiles = [];
// --- readdirSync - reads file from the "./" directory 
//     Sync means it doesn't proceed until the files have been read
const files = fs.readdirSync("./");
files.forEach(function(file){
    // --- Only load *.out files, add them to the outFile array
    //     .pop get the last item in the array, in this case the file extension
    if(file.split(".").pop().toLowerCase()=="out")  outFiles.push(file);
});

// --- Load the selections for the choice questions
const server = ['SOM', 'UHC'];
const environment = ['QA', 'PROD'];
const runnerType = ['Concurrent', 'Solo'];

// -- Set up questions to ask to run the utility, an array with question definition
const askFile = [
  // --- Select the OUT file to process
  {
    type: 'list',
    name: 'fileName',
    message: 'Please select OUT to process, use arrows to scroll though list, enter to select file',
    choices: outFiles  //-- Set in code above
  },
  // --- runID usually a number to identify the process that ran the CURL script
  {
    type: 'input',
    name: 'runID',
    message: 'Enter a RunID for this OUT file, do not leave blank:',
    // --- Verify document name entered
    validate: function(value) {
        if(value !== null && value !== '') {
            return true;
         } else {
             return "*** You must enter a RunID. ***";
         }            
    }       
  },
  // --- Select the server from list
  {
    type: 'list',
    name: 'server',
    message: 'What is the server the "runner.sh" was run from, please select one',
    choices: server  //-- Set in code above
  },
  // --- Select the environment from list
  {
    type: 'list',
    name: 'environment',
    message: 'What is the environment the "runner.sh" was run against, please select one',
    choices: environment  //-- Set in code above
  },
  // --- Select the runnerType from list
  {
    type: 'list',
    name: 'runnerType',
    message: 'What is the runner type for test, please select one',
    choices: runnerType  //-- Set in code above
  }
  // 

];

// --- Ask the questions using the 'askFile' above, take first answer ans read the OUT file
let readFile = "";  // --- Name of OUT file to read in
inquirer.prompt(askFile)
  // --- After all questions answered the code below gets run
  //     'answers' is an array with the responses to the questions, in the order they were asked
  .then(answers => {
    // --- template syntax used tick(`) surrounds entire string, single-quote around the variable
    //     variable is in ${variable}
    console.log(` Questions answered`);
    //readOUT(answers.fileName);    // --- Read the selected OUT file , sync
    processOutText(answers)              // --- Core of extraction
  });

