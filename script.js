// Get username from URL
var name = location.search.slice(1);

// If username not found in the URL ask using prompt
if (name == "") {
    name = prompt('Please enter a username. After that you can send emails to <USERNAME>@maildrop.cc to view them in this app.', 'test');
    location.href = location.origin + '?' + name
}

// Update footer email name
let username = name + "@maildrop.cc";
document.getElementById('mailBox').innerHTML = `
<a title="Send email to ${username} to view it in this app." href="mailto:${username}">${username}</a>
`;

var filteredEmailData;
var activeEmail = {};
const emailList = document.querySelector('#emailList ul');

// Get list of read emails fro localStorage
var readEmails = localStorage.getItem('readEmails');
readEmails = readEmails ? JSON.parse(readEmails) : [];

var activePage = 'inbox';

/**
 * @desc render filtered email list in the webpage.
 */
function renderEmails() {

    var emailDataTemp = filteredEmailData;

    if (activePage == 'favourites') {
        emailDataTemp = emailDataTemp.filter(x => x.isFavorite)
    }

    if (emailDataTemp.length) {
        emailList.innerHTML = emailDataTemp.map(email => {
            let date = new Date(email.date).toDateString().split(" ");
            let from = email.from.split("<")[0].substr(0, 30);
            let unread = true;
            if (readEmails.includes(email.id)) {
                unread = false;
            }
            return `
    <li class="${email.id == activeEmail.id ? 'active' : ''}">
        <div onclick="setActiveEmail('${email.id}')" class="">
            <div class="info">
                <div class="from" title="${email.from}">${from} ${from.length > 30 ? '...' : ''}</div>
                <div class="date">${date[1]} ${date[2]}, ${date[3]}</div>
            </div>
            <div class="info-2">
                <div class="subject" title="${email.subject}">${email.subject.substr(0, 30)} ${email.subject.length > 30 ? '...' : ''}</div>
                <div class="icons">
                    <span ${unread ? 'class="unread" title="unread"' : ''}></span>
                    <a onclick="toggleFavourite(event, '${email.id}')">
                        <i class="mdi ${email.isFavorite ? 'mdi-star' : 'mdi-star-outline'}" title="Toggle favourite"></i>    
                    </a>
                </div>
            </div>
        </div>
    </li>
    `}).join("");
    } else {
        emailList.innerHTML = `

        <div class="no-result">
            <img src="assets/images/no-search-result.png" />
            <div>No results found</div>
        </div>
        
        `;
    }
}

/**
 * @desc Delete email with given ID
 * @param {String} id 
 */
function deleteEmail(id) {
    // Microinteraction: Adding loader icon in delete button
    document.getElementById('deleteIcon').className = "mdi mdi-spin mdi-loading";

    // API call to delete email from server
    utility.http({ url: `https://api.maildrop.cc/v2/mailbox/${name}/${id}`, method: 'DELETE' }).then(() => {
        filteredEmailData = filteredEmailData.filter(x => x.id != id);
        if (activeEmail.id == id) {
            setActiveEmail();
        }
        renderEmails();
    })
}

/**
 * @desc Get complete email data from API and render it in webpage.
 * @param {String} id 
 */
var emailCache = [];
const activeEmailDiv = document.getElementById('fullEmail');
async function setActiveEmail(id) {
    let output = "";
    if (id) {
        let cache = emailCache.find(x => x.id == id);
        if (!cache) {
            activeEmailDiv.innerHTML = 'Loading ...';
            activeEmail = filteredEmailData.find(x => x.id == id);
            renderEmails();
            activeEmail = await getEmailFromApi(id);
            emailCache.push(activeEmail);
            if (!readEmails.includes(id)) {
                readEmails.push(id);
                localStorage.setItem('readEmails', JSON.stringify(readEmails));
            }
        }
        else {
            activeEmail = cache;
        }
        if (activeEmail) {
            let from = activeEmail.from.split("<");
            let name, email;
            if (from[0].includes('@')) {
                email = from[0];
                name = from[0].split('@')[0];
            } else {
                name = from[0];
                email = from[1].split(">")[0];
            }
            output = `
            <div class="toolbar">
                <div class="from">
                    <div class="name">${name}</div>
                    <div class="email">${email}</div>
                </div>
                <div class="actions">
                    <div class="date"> ${new Date(activeEmail.date).toUTCString()}</div>
                    <a onclick="deleteEmail('${activeEmail.id}')" title="Delete email" class="delete">
                        <i class="mdi mdi-delete" id="deleteIcon"></i>
                    </a>
                </div>
            </div>

            <div class="subject">${activeEmail.subject}</div>

            <div class="body">
                <iframe id="bodyIframe"></iframe>
            </div>
            `;
        }
    }

    activeEmailDiv.innerHTML = output;
    activeEmail.isRead = true;

    // Adding HTML of email in iframe to prevent styles conflict between our app and html of email body.
    var doc = document.getElementById('bodyIframe').contentWindow.document;
    doc.open();
    doc.write(activeEmail.html);
    doc.close();

    renderEmails();
    updateUnreadCount();
}

/**
 * @desc Toggle favourite against an email to add/remove email from favourites list
 * @param {*} e 
 * @param {String} id 
 */
function toggleFavourite(e, id) {
    // To prevent event bubbling
    e.stopPropagation();

    const email = filteredEmailData.find(x => x.id == id);
    email.isFavorite = !email.isFavorite;
    renderEmails();
}

/**
 * @desc Update unread count beside Inbox button
 */
const unreadCount = document.querySelector('#inbox .unread-count');
function updateUnreadCount() {
    const readEmailsHashmap = utility.arrayToHashmap(readEmails);
    unreadCount.innerHTML = filteredEmailData.length - filteredEmailData.filter(x => readEmailsHashmap[x.id]).length;
}

/**
 * @desc Filter emails based on search term.
 * Implemented debouncing here.
 */
var emailData;
var searchEmails = utility.debounce((searchTerm) => {
    console.log("Searching ...");

    if (searchTerm) {
        let tempData = emailData.slice(0);

        // Iterating through all space separated terms in the search term.
        searchTerm.trim().toLowerCase().split(" ").forEach(term => {
            tempData = tempData.filter(x => x.subject.toLowerCase().includes(term) || x.from.toLowerCase().includes(term))
        })
        filteredEmailData = tempData;
    }
    // If search term is empty, render all emails
    else {
        filteredEmailData = emailData.slice(0);
    }

    renderEmails();
}, 300)

/**
 * @desc get email data from API 
 * If id is present, get complete details of email with given id
 * Else get all emails
 * @param {String} id optional
 */
function getEmailFromApi(id = "") {
    return utility.http({ url: `https://api.maildrop.cc/v2/mailbox/${name}/${id}`, method: 'GET' })
}

/**
 * @desc set active folder (Inbox, Favourites)
 */
const foldersListElement = document.querySelector('#folders > ul').children;
function setActiveFolder(ele) {
    // Remove active class from all items in the
    for (let i = 0; i < foldersListElement.length; i++) {
        foldersListElement[i].children[0].className = "";
    }

    // set active class for clicked element
    if (ele.className.includes('active'))
        ele.className = '';
    else
        ele.className = 'active';
}

/**
 * @desc sort emails based on date
 * Implemented throttle here.
 */
var sortEmails = utility.throttle(function (ele) {
    console.log("Sorting");

    if (ele.children[0].className.includes('descending')) {
        // Sort descending
        filteredEmailData.sort((a, b) => new Date(a.date) - new Date(b.date));
        ele.children[0].className = "mdi mdi-sort-ascending"
    }
    else {
        // Sort ascending
        filteredEmailData.sort((a, b) => new Date(b.date) - new Date(a.date));
        ele.children[0].className = "mdi mdi-sort-descending"
    }
    renderEmails();
}, 500)

// Add loading message till data arrives
emailList.innerHTML = `<div class="loading">Loading ...</div>`;

// Get all emails from API and render it in web page
getEmailFromApi()
    .then(res => {
        console.log(res);
        emailData = res.messages;
        filteredEmailData = emailData.slice(0)
        renderEmails();
        updateUnreadCount();
    })


/**
 * RESIZABLE COLUMNS
 */

utility.makeResizable({ id: 'folders', minWidth: '15%', maxWidth: '400px' })
utility.makeResizable({ id: 'emailList', minWidth: '30%', maxWidth: '550px' })