<!--
/*
If you are seeing this message, then
this will not work on your computer.
















RS - VERSON 0.7 - May 19, 1998
version 0.8  - November 22, 1999 - changed \r to \n

Script & HTML Template and Data Copyright (C) 1998-9 by Charles Kelly
All Rights Reserved.  Ask for permission if you want to use this script.
See: http://www.manythings.org/rs/
Started in April 1998,
*/
function r(n) {
  return Math.round(Math.random() * (n - 1))
}

function f(s) {
  return s.substring(0, 1).toUpperCase() + s.substring(1, s.length)
}

function d(n) {
  var t = [];
  for (i = 0; i < n; i++) {
    t.push(u())
  }
  return t
}

function u() {
  var t = v[r(v.length)];
  var i;
  var s = "";
  for (i = 0; i < t.length; i++) {
    var c = t.substring(i, i + 1);
    var w = ""
    if (c == '0'){
        w = Joe[r(Joe.length)]
      } else if (c == '1') w = swim[r(swim.length)]
    else if (c == '2') w = swims[r(swims.length)]
    else if (c == '3') w = swimming[r(swimming.length)]
    else if (c == '4') w = swam[r(swam.length)]
    else if (c == '5') w = swum[r(swum.length)]
    else if (c == '6') w = camera[r(camera.length)]
    else if (c == '7') w = cameras[r(cameras.length)]
    else if (c == '8') w = pretty[r(pretty.length)]
    else if (c == '@') w = busy[r(busy.length)]
    else if (c == '9') w = well[r(well.length)]
    else if (c == '_') w = banker[r(banker.length)]
    else if (c == '*') w = bankers[r(bankers.length)]
    else if (c == '+') w = here[r(here.length)]
    else if (c == '[') w = yesterday[r(yesterday.length)]
    else if (c == ']') w = tomorrow[r(tomorrow.length)]
    else if (c == '$') w = now[r(now.length)]
    else if (c == '/') w = always[r(always.length)]
    else if (c == '|') w = everyday[r(everyday.length)]
    else if (c == '#') w = must[r(must.length)]
    else if (c == '%') w = for2hours[r(for2hours.length)]
    else if (c == '<') w = fun[r(fun.length)]
    else if (c == '=') w = able[r(able.length)]
    else if (c == '^') w = agree[r(agree.length)]
    else if (c == '`') w = agrees[r(agrees.length)]
    else if (c == '~') w = agreeing[r(agreeing.length)]
    else if (c == '&') w = agreed[r(agreed.length)]
    else if (c == ';') w = ask[r(ask.length)]
    else if (c == ':') w = asks[r(asks.length)]
    else if (c == '>') w = asking[r(asking.length)]
    else if (c == '-') w = asked[r(asked.length)]
    else if (c == '(') w = enjoy[r(enjoy.length)]
    else if (c == ')') w = enjoys[r(enjoys.length)]
    else if (c == '{') w = enjoying[r(enjoying.length)]
    else if (c == '}') w = enjoyed[r(enjoyed.length)]
    else w = c;
    s += w
  }
  return f(s)
}

var v = ["0 didn't ; 0 to 1 %.","0 didn't ; 0 to 1 +.","0 didn't ; 0 to 1 9.","0 didn't ; 0 to 1 [.","0 didn't ; 0 to 1 because 0 had 5.","0 didn't ; 0 to 1.","0 doesn't / ; 0 to 1.","0 doesn't ; 0 to 1 %.","0 doesn't ; 0 to 1 +.","0 doesn't ; 0 to 1 9.","0 doesn't ; 0 to 1 |.","I / ; 0 to 1.","I ; 0 to 1 %.","I ; 0 to 1 +.","I ; 0 to 1 9.","I ; 0 to 1 |.","I didn't ; 0 to 1 %.","I didn't ; 0 to 1 +.","I didn't ; 0 to 1 9.","I didn't ; 0 to 1 [.","I didn't ; 0 to 1.","I don't / ; 0 to 1.","I don't ; 0 to 1 %.","I don't ; 0 to 1 +.","I don't ; 0 to 1 9.","I don't ; 0 to 1 |.","I'll ; 0 to 1 as soon as you have 5.","Many * ; 0 to 1 |.","Many * don't ; 0 to 1 |.","Some * ; 0 to 1 +.","That _ doesn't ; 0 to 1 |.","The * / ; 0 to 1.","The * ; 0 to 1 %.","The * ; 0 to 1 9.","The * don't / ; 0 to 1.","The * don't ; 0 to 1 %.","The * don't ; 0 to 1 +.","The * don't ; 0 to 1 9.","The _ doesn't / ; 0 to 1.","The _ doesn't ; 0 to 1 %.","The _ doesn't ; 0 to 1 +.","The _ doesn't ; 0 to 1 9.","Those * didn't ; 0 to 1 %.","Those * didn't ; 0 to 1 +.","Those * didn't ; 0 to 1 9.","Those * didn't ; 0 to 1 [.","Those * didn't ; 0 to 1.","0 didn't 1 because 0 had - 0 to 1.","0 had - 0 to 1 %.","0 had already - 0 to 1.","0 had just - 0 to 1.","0 has - 0 to 1 %.","0 has - 0 to 1 since [.","0 has - 0 to 1.","0 has already - 0 to 1.","0 has just - 0 to 1.","0 hasn't - 0 to 1 yet.","0 hasn't - 0 to 1.","0 wasn't + because 0 had - 0 to 1 %.","He's just - 0 to 1.","I have - 0 to 1 %.","I have - 0 to 1 since [.","I have - 0 to 1.","I have just - 0 to 1.","I haven't - 0 to 1 yet.","I haven't - 0 to 1.","I was feeling @ because I had just - 0 to 1.","I'll 1 as soon as you have - 0 to 1.","I've already - 0 to 1.","Let me know when you have - 0 to 1.","She has - 0 to 1 %.","She has - 0 to 1 since [.","She has - 0 to 1.","Some * have already - 0 to 1.","Tell me when you have - 0 to 1.","The * have - 0 to 1 %.","The * have - 0 to 1 since [.","The * have - 0 to 1.","The * haven't - 0 to 1 yet.","The * haven't - 0 to 1.","They have - 0 to 1 %.","They have - 0 to 1 since [.","They have - 0 to 1.","They have just - 0 to 1.","They haven't - 0 to 1 yet.","They haven't - 0 to 1.","They've already - 0 to 1.","Those * have just - 0 to 1.","0 is > 0 to 1 $.","0 is > 0 to 1 + $.","0 is > 0 to 1 +.","0 is > 0 to 1.","0 is always > 0 to 1.","0 is not > 0 to 1 $.","0 is not > 0 to 1 + $.","0 is not > 0 to 1 +.","0 is not > 0 to 1.","0 isn't > 0 to 1 $.","0 isn't > 0 to 1 + $.","0 isn't > 0 to 1 +.","0 isn't > 0 to 1.","0 was > 0 to 1 +.","0 was > 0 to 1 9.","0 was > 0 to 1 [.","0 was > 0 to 1.","0 wasn't > 0 to 1 +.","0 wasn't > 0 to 1 9.","0 wasn't > 0 to 1 [.","0 wasn't > 0 to 1.","I am > 0 to 1 $.","I am > 0 to 1 + $.","I am > 0 to 1 +.","I am > 0 to 1.","I am not > 0 to 1 $.","I am not > 0 to 1 + $.","I am not > 0 to 1 +.","I am not > 0 to 1.","I had been > 0 to 1 but I was > 0 to 1.","I was > 0 to 1 +.","I was > 0 to 1 9.","I was > 0 to 1 [.","I was > 0 to 1.","I wasn't > 0 to 1 +.","I wasn't > 0 to 1 9.","I wasn't > 0 to 1 [.","I wasn't > 0 to 1.","I'm not > 0 to 1 $.","I'm not > 0 to 1 + $.","I'm not > 0 to 1 +.","I'm not > 0 to 1.","That _ is > 0 to 1 $.","That _ is > 0 to 1 + $.","That _ is > 0 to 1 +.","That _ is > 0 to 1.","That _ is not > 0 to 1 $.","That _ is not > 0 to 1 + $.","That _ is not > 0 to 1 +.","That _ is not > 0 to 1.","That _ isn't > 0 to 1 $.","That _ isn't > 0 to 1 + $","That _ isn't > 0 to 1 +.","That _ isn't > 0 to 1.","The * were > 0 to 1 +.","The * were > 0 to 1 9.","The * were > 0 to 1 [.","The * were > 0 to 1.","The * weren't > 0 to 1 +.","The * weren't > 0 to 1 9.","The * weren't > 0 to 1 [.","The * weren't > 0 to 1.","They are > 0 to 1 $.","They are > 0 to 1 + $.","They are > 0 to 1 +.","They are > 0 to 1.","They are not > 0 to 1 $.","They are not > 0 to 1 + $.","They are not > 0 to 1 +.","They are not > 0 to 1.","They aren't > 0 to 1 $.","They aren't > 0 to 1 + $.","They aren't > 0 to 1 +.","They aren't > 0 to 1.","Those * are > 0 to 1 $.","Those * are > 0 to 1 + $.","Those * are > 0 to 1 +.","Those * are > 0 to 1.","Those * are not > 0 to 1 $.","Those * are not > 0 to 1 + $.","Those * are not > 0 to 1 +.","Those * are not > 0 to 1.","Those * aren't > 0 to 1 $.","Those * aren't > 0 to 1 + $.","Those * aren't > 0 to 1 +.","Those * aren't > 0 to 1.","You are always > 0 to 1.","You were > 0 to 1 +.","You were > 0 to 1 9.","You were > 0 to 1 [.","You were > 0 to 1.","You weren't > 0 to 1 +.","You weren't > 0 to 1 9.","You weren't > 0 to 1 [.","You weren't > 0 to 1.","[ 0 was still > 0 to 1.","[ I was still > 0 to 1.","[ the * were still > 0 to 1.","0 - 0 to 1 %.","0 - 0 to 1 +.","0 - 0 to 1 9.","0 - 0 to 1 [.","0 - 0 to 1.","I - 0 to 1 %.","I - 0 to 1 +.","I - 0 to 1 9.","I - 0 to 1 [.","I - 0 to 1.","The * - 0 to 1 %.","The * - 0 to 1 +.","The * - 0 to 1 9.","The * - 0 to 1 [.","The * - 0 to 1.","0 / : 0 to 1.","0 : 0 to 1 |.","0 : 0 to 1.","That _ : 0 to 1 |.","The _ / : 0 to 1.","The _ : 0 to 1 %.","The _ : 0 to 1 9.","The _ : 0 to 1.","I was 3.","0 was 3.","The * were 3.","You were 3.","I wasn't 3.","0 wasn't 3.","The * weren't 3.","You weren't 3.","I was 3 [.","0 was 3 [.","The * were 3 [.","You were 3 [.","I wasn't 3 [.","0 wasn't 3 [.","The * weren't 3 [.","You weren't 3 [.","I was 3 +.","0 was 3 +.","The * were 3 +.","You were 3 +.","I wasn't 3 +.","0 wasn't 3 +.","The * weren't 3 +.","You weren't 3 +.","I was 3 9.","0 was 3 9.","The * were 3 9.","You were 3 9.","I wasn't 3 9.","0 wasn't 3 9.","The * weren't 3 9.","You weren't 3 9.","[ 0 was still 3.","[ I was still 3.","[ the * were still 3."];
var Joe = new Array("Joe", "Abraham", "Albert", "Alfred's niece", "Amanda", "Andrew's uncle", "Andy", "Ann Lynn", "Anthony", "Ashley", "Becky", "Betsy's nephew", "Betty Sue", "Betty", "Bill's wife", "Bob", "Bruce", "Buddy", "Catherine", "Cathy", "Charlie", "Christine", "Connie's husband", "Dave", "David", "Debbie", "Deborah's son", "Dick", "Donna's daughter", "Doug", "Ed", "Edward", "Eleanor", "Elizabeth", "Erika", "Frank", "Fred's wife", "George", "Ginger", "Glenn", "Jack", "Jackie", "Jane", "Jennifer", "Jenny", "Jessica", "Jimmy Joe", "Joe", "Joe's girlfriend", "Joanne's mother", "John", "Joseph", "Judith", "Julie", "Kate's granddaughter", "Larry", "Lawrence", "Lester's ex-wife", "Lonnie", "Luke", "Margaret", "Marge", "Mark", "Martha", "Marty", "Mary", "Matthew", "Meg", "Michael", "Mike", "Miss Johnson", "Mr. Hanson", "Mrs. O'Day", "Ms. Brown", "Ned", "Patricia", "Patty", "Paul's grandson", "Pete", "Peter", "Rebecca", "Richard", "Rita's aunt", "Robert", "Roger's father", "Rosie", "Roy", "Sandra", "Sandy", "Sarah", "Stephen", "Steve", "Sue", "Suzanne", "Thomas", "Tom", "Tony", "Virginia", "Willie");
var swim = new Array("cook", "dance", "drive", "eat", "fight", "jog", "jump", "laugh", "play", "pray", "read", "run", "shave", "shout", "sing", "ski", "sleep", "study", "surf", "swim", "talk", "walk", "work", "write");
var swims = new Array("cooks", "dances", "drives", "eats", "fights", "jogs", "jumps", "laughs", "plays", "prays", "reads", "runs", "shaves", "shouts", "sings", "skis", "sleeps", "studies", "surfs", "swims", "talks", "walks", "works", "writes");
var swimming = new Array("cooking", "dancing", "driving", "eating", "fighting", "jogging", "jumping", "laughing", "playing", "praying", "reading", "running", "shaving", "shouting", "singing", "skiing", "sleeping", "studying", "surfing", "swimming", "talking", "walking", "working", "writing");
var swam = new Array("cooked", "danced", "drove", "ate", "fought", "jogged", "jumped", "laughed", "played", "prayed", "read", "ran", "shaved", "shouted", "sang", "skied", "slept", "studied", "surfed", "swam", "talked", "walked", "worked", "wrote");
var swum = new Array("cooked", "danced", "driven", "eaten", "fought", "jogged", "jumped", "laughed", "played", "prayed", "read", "run", "shaved", "shouted", "sung", "skied", "slept", "studied", "surfed", "swum", "talked", "walked", "worked", "written");
var camera = new Array("camera", "bag", "belt", "book", "box", "car", "clock", "cup", "dish", "dress", "fork", "hammer", "hat", "knife", "letter", "motorcycle", "pair of pliers", "pair of scissors", "pen", "pencil", "picture", "screwdriver", "suitcase", "sweater", "table", "textbook");
var cameras = new Array("cameras", "boats", "books", "boots", "caps", "cars", "chairs", "clothes", "eggs", "glasses", "gloves", "guitars", "helicopters", "keys", "motorcycles", "pens", "photographs", "pictures", "shoes", "socks", "textbooks", "trucks", "umbrellas", "watches");
var well = new Array("well", "badly", "carefully", "carelessly", "fast", "nicely", "quickly", "slowly", "well");
var pretty = new Array("pretty", "beautiful", "big", "cheap", "clean", "cold", "dirty", "dry", "fancy", "heavy", "large", "light", "little", "new", "plain", "small", "strange");
var busy = new Array("busy", "brave", "careless", "crazy", "dangerous", "famous", "fat", "friendly", "helpful", "hungry", "kind", "lazy", "lucky", "polite", "poor", "popular", "quiet", "rude", "sad", "selfish", "short", "skinny", "sleepy", "strange", "tall", "thin", "tired", "ugly");
var banker = new Array("banker", "barber", "bartender", "bus driver", "car mechanic", "carpenter", "cashier", "computer programmer", "dentist", "doctor", "farmer", "fisherman", "flight attendant", "garbage man", "gardener", "guard", "janitor", "journalist", "lawyer", "librarian", "manager", "musician", "news announcer", "photographer", "pilot", "plumber", "police officer", "politician", "science teacher", "scientist", "singer", "spy", "store clerk", "student", "taxi driver", "teacher", "thief");
var bankers = new Array("bankers", "barbers", "bartenders", "bus drivers", "car mechanics", "carpenters", "cashiers", "computer programmers", "dentists", "doctors", "farmers", "fishermen", "flight attendants", "gardeners", "guards", "janitors", "journalists", "lawyers", "librarians", "managers", "musicians", "news announcers", "photographers", "pilots", "plumbers", "police officers", "politicians", "science teachers", "scientists", "singers", "store clerks", "students", "taxi drivers", "teachers", "thieves");
var able = new Array("able", "ashamed", "delighted", "determined", "glad", "happy", "hesitant", "lucky", "obliged", "pleased", "prepared", "ready", "reluctant", "scheduled", "too angry", "willing");
var here = new Array("here", "among the trees", "at home", "at school", "at the bank", "at the barbershop", "at the bookstore", "at the company", "at the drugstore", "behind the post office", "below the bridge", "between the two buildings", "between the two mountains", "by the sea", "in London", "in New York", "in front of the restaurant", "in the classroom", "in the doghouse", "in the living room", "in the mountains", "in the river", "near the station", "near my home", "near our school", "near the tree", "next to the police station", "on the street", "on the top of the mountain", "over there", "under the bridge");
var yesterday = new Array("yesterday", "a few days ago", "earlier this morning", "early last month", "five weeks ago", "last December", "last January", "last Monday", "last month", "last night at eleven", "last night", "last summer", "last week", "last weekend", "last winter", "last year", "late yesterday afternoon", "many years ago", "several months ago", "the day before yesterday", "the week before last", "the year before last", "three years ago", "two days ago", "two months ago", "yesterday afternoon", "yesterday morning");
var tomorrow = new Array("tomorrow", "a few weeks from now", "before long", "early next month", "five weeks from now", "in a couple of months", "in a day or two", "in a few days", "in a month", "in a week or two", "in five years", "late tomorrow afternoon", "many years from now", "next February", "next Saturday", "next month", "next spring", "next summer", "next week", "next year", "several years from now", "soon", "the day after tomorrow", "the month after next", "three days from now", "tomorrow afternoon", "tomorrow evening", "tomorrow morning", "tomorrow night at nine");
var now = new Array("now", "at present", "at the moment", "at this exact moment", "at this time", "just now", "nowadays", "right at this time", "right now", "these days", "today");
var always = new Array("always", "frequently", "generally", "very often", "often", "usually");
var everyday = new Array("every day", "about once a week", "all the time", "as often as possible", "at least twice a week", "every evening", "every month", "every night", "every other day", "every other month", "every other week", "every third day", "every thirty minutes", "every year", "four or five times a day", "three times a day", "more than four times a month", "once a week", "once or twice a year", "three times a year", "twice a day", "twice a month");
var must = new Array("must", "can", "could", "may", "might", "should", "will", "would");
var for2hours = new Array("for two hours", "all afternoon", "all day long", "all night", "all weekend", "for a day or two", "for a few hours", "for a few months", "for a long time", "for five years", "for four months", "for half an hour", "for many weeks", "for more than an hour", "for quite a few years", "for quite some time", "for six weeks", "for ten minutes", "for three days", "for three or four weeks", "for two or three months", "from Monday through Friday", "from six until eight");
var fun = new Array("fun", "a lot of fun", "bad", "boring", "cheap", "dangerous", "easy", "exciting", "expensive", "good", "hard", "impossible", "interesting", "possible", "safe");
var agree = new Array("agree", "demand", "desire", "expect", "know how", "like", "need", "offer", "promise", "refuse", "want", "wish");
var agrees = new Array("agrees", "demands", "desires", "expects", "knows how", "likes", "needs", "offers", "promises", "refuses", "wants", "wishes");
var agreeing = new Array("agreeing", "demanding", "expecting", "offering", "promising", "refusing", "wishing");
var agreed = new Array("agreed", "demanded", "desired", "expected", "liked", "needed", "offered", "promised", "refused", "wanted", "wished");
var ask = new Array("ask", "advise", "allow", "beg", "encourage", "expect", "forbid", "force", "get", "help", "invite", "need", "order", "permit", "persuade", "remind", "tell", "train", "urge", "want");
var asks = new Array("asks", "advises", "allows", "begs", "encourages", "expects", "forbids", "forces", "gets", "helps", "invites", "needs", "orders", "permits", "persuades", "reminds", "tells", "trains", "urges", "wants");
var asking = new Array("asking", "advising", "allowing", "begging", "encouraging", "expecting", "forcing", "helping", "ordering", "persuading", "reminding", "telling", "training", "urging");
var asked = new Array("asked", "advised", "allowed", "begged", "encouraged", "expected", "forced", "helped", "invited", "ordered", "persuaded", "reminded", "told", "trained", "urged", "wanted");
var enjoy = new Array("enjoy", "dislike", "hate", "like", "love", "miss", "practice", "regret", "remember");
var enjoys = new Array("enjoys", "dislikes", "hates", "likes", "loves", "misses", "practices", "regrets", "remembers");
var enjoying = new Array("enjoying", "missing", "practicing");
var enjoyed = new Array("enjoyed", "disliked", "hated", "liked", "loved", "missed", "practiced", "regretted", "remembered");
// -->
