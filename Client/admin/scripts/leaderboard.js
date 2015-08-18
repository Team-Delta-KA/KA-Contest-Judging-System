/* Get the GET params: */
var getParams = Contest_Judging_System.getGETParams();
/* If we don't find the contest parameter in the URL, tell the user to specify one, and navigate one page back in their history. */
if (!getParams.contest) {
	alert("Please specify a Contest ID!");
	window.history.back();
}

/* Get the contest ID: */
var contestId = getParams.contest;

/* Log the Contest ID that we found, to the console. */
console.log("Contest ID found! " + contestId);

/* The gloabl user data and entry data: */
var global_userData = { };
var global_entryData = { };

function loadLeaderboard(contestData, entryData) {
    /* This function loads the leaderboard with the contest data and entry data: */

    /* Get the rubrics: */
    Contest_Judging_System.getRubricsForContest(contestData.id, function(rubrics) {
        console.log(rubrics);
        /* Make the columns with id, title, each rubric, and a summed score: */
        var cols = [ { data: "Entry ID" }, { data: "Entry Title" } ];
        for (var i = 0; i < rubrics.Order.length; i++) {
            cols.push({ data: rubrics.Order[i] });
        }
        cols.push({ data: "Summed Score" });

        /* The table heading: */
        var tableHeading = document.querySelector("#leaderboardTable thead tr");
        /* For each column: */
        for (var col = 0; col < cols.length; col++) {
            /* Create a <td> element with the column data and append it into the heading: */
            var td = document.createElement("td");
            td.textContent = cols[col].data;
            tableHeading.appendChild(td);
        }

        /* The list of all the table data: */
        var tableDataList = [ ];
        /* For all entries: */
        for (var i in entryData) {
            /* This is the object representing the table data for this entry: */
            var objToAdd = {
                "Entry ID": entryData[i].id,
                "Entry Title": "<a href=\"https://www.khanacademy.org/computer-programming/entry/"+entryData[i].id+"\">"+entryData[i].name+"</a>"
            };

            /* The summed score for this entry: */
            var summedScore = 0;
            /* For each rubric: */
            for (var j = 0; j < rubrics.Order.length; j++) {
                /* The score for this rubric is the average, unless it hasn't been graded yet, in which case it's the minimum: */
                var score = entryData[i].scores.rubric.hasOwnProperty(rubrics.Order[j]) ? entryData[i].scores.rubric[rubrics.Order[j]].avg : rubrics.Order[j].min;
                /* Increment summedScore by score: */
                summedScore += score;
                /* If this is a keys rubric, set the scores using score and the keys property: */
                if (rubrics[rubrics.Order[j]].hasOwnProperty("keys")) {
                    objToAdd[rubrics.Order[j]] = rubrics[rubrics.Order[j]].keys[score];
                }
                /* Otherwise, just set the scores using score: */
                else {
                    objToAdd[rubrics.Order[j]] = score;
                }
            }
            /* Add summedScore to objToAdd: */
            objToAdd["Summed Score"] = summedScore;
            /* Push objToAdd into tableDataList: */
            tableDataList.push(objToAdd);
        }

        /* Create a DataTable using cols and tableDataList: */
        $("#leaderboardTable").DataTable({
            columns: cols,
            data: tableDataList
        });
        /* Hide the loading message and show the content: */
        $(".dataLoadMsg").css("display", "none");
        $(".hideWhileDataLoad").css("display", "block");
    });
}

function loadData() {
    /* This function loads the contest data and the data for all of the entries: */

    Contest_Judging_System.get_N_Entries(KA_API.misc.allData, contestId, global_userData.permLevel, fbAuth.uid, true, function(contestData, entryData) {
        /* Set global_entryData and call loadLeaderboard(): */
        global_entryData = entryData;
        loadLeaderboard(contestData, entryData);
        $("#loading").css("display", "none");
	});
}

/* Connect to Firebase: */
var fbRef = new Firebase("https://contest-judging-sys.firebaseio.com");
/* The Firebase auth data: */
var fbAuth;
/* When the auth state changes (and on pageload): */
fbRef.onAuth(function(fbAuthLocal) {
    fbAuth = fbAuthLocal;
    /* Get the user data if they're logged in: */
    if (fbAuth) {
        Contest_Judging_System.getUserData(fbAuth.uid, function(userData) {
            global_userData = userData;
            global_userData.uid = fbAuth.uid;
            /* Load the entries when done: */
            loadData();
        });
    }
    /* Otherwise, just load the entries with default data: */
    else {
        window.location.assign(window.location.replace("/admin/leaderboard.html?contest=" + contestId, ""));
    }
});