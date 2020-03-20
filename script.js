
// window.location.href = 'https://github.com/'
var name = location.search.slice(1);
if (name == "") {
    name = prompt('Please enter a username', 'test');
    location.href = location.origin + '?' + name
}
// Update footer email name
document.getElementById('mailBox').innerText = name + "@mailbox.cc";

var filteredEmailData;

var activeEmail = {};
const emailList = document.querySelector('#emailList ul');

var readEmails = localStorage.getItem('readEmails');
readEmails = readEmails ? JSON.parse(readEmails) : [];

var activePage = 'inbox';
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

    // localStorage.setItem('emailData', JSON.stringify(emailData));
}

function deleteEmail(id) {
    document.getElementById('deleteIcon').className = "mdi mdi-spin mdi-loading";
    utility.http({ url: `https://api.maildrop.cc/v2/mailbox/${name}/${id}`, method: 'DELETE' }).then(() => {
        filteredEmailData = filteredEmailData.filter(x => x.id != id);
        if (activeEmail.id == id) {
            setActiveEmail();
        }
        renderEmails();
    })
}

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

    var doc = document.getElementById('bodyIframe').contentWindow.document;
    doc.open();
    doc.write(activeEmail.html);
    doc.close();

    renderEmails();
    updateUnreadCount();
}

function toggleFavourite(e, id) {
    e.stopPropagation();
    const email = filteredEmailData.find(x => x.id == id);
    email.isFavorite = !email.isFavorite;

    renderEmails();
}

const unreadCount = document.querySelector('#inbox .unread-count');
function updateUnreadCount() {
    const readEmailsHashmap = utility.arrayToHashmap(readEmails);
    unreadCount.innerHTML = filteredEmailData.length - filteredEmailData.filter(x => readEmailsHashmap[x.id]).length;
}

var emailData;
var searchEmails = utility.debounce((searchTerm) => {
    console.log("Searching ...");

    if (searchTerm) {
        let tempData = emailData.slice(0);
        searchTerm.trim().toLowerCase().split(" ").forEach(term => {
            tempData = tempData.filter(x => x.subject.toLowerCase().includes(term) || x.from.toLowerCase().includes(term))
        })
        filteredEmailData = tempData;
    }
    else {
        filteredEmailData = emailData.slice(0);
    }

    renderEmails();
}, 300)

function getEmailFromApi(id = "") {
    return utility.http({ url: `https://api.maildrop.cc/v2/mailbox/${name}/${id}`, method: 'GET' })

}

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
// emailData = JSON.parse(localStorage.getItem('emailData') || '[]');

emailList.innerHTML = `<div class="loading">Loading ...</div>`;
getEmailFromApi()
    .then(res => {
        console.log(res);
        emailData = res.messages;
        filteredEmailData = emailData.slice(0)
        renderEmails();
        updateUnreadCount();
    })



/**
 * RESIZABLE EMAIL LIST !!!
 */

const emailListWrapper = document.getElementById('emailList');

// Set width if available in localstorage
let width = localStorage.getItem('emailListWidth');
if (width) {
    emailListWrapper.style.width = width + "px"
}

function mouseDown() {
    // console.log("Mouse down!!!");

    // Listen for mouseup
    document.addEventListener('mouseup', mouseUp)

    // Listen for mousemove
    document.addEventListener('mousemove', mouseMove)

    // Disable text selection
    document.addEventListener('selectstart', disableSelect);

}
document.getElementById('resizeBar').addEventListener('mousedown', mouseDown)

function mouseUp() {
    // console.log("Mouse up");

    // Stop listening to mouseup and mousemove
    document.removeEventListener('mouseup', mouseUp)
    document.removeEventListener('mousemove', mouseMove)

    // Re-enable text selection
    document.removeEventListener('selectstart', disableSelect);

    // Store final width in localStorage
    localStorage.setItem('emailListWidth', width);
    console.log("Saving width ...", width);

}

let left = emailListWrapper.getClientRects()[0].x;
function mouseMove(event) {
    // console.log("Dragging...", event.x - left);
    width = event.x - left;
    emailListWrapper.style.width = width + "px";
}

function disableSelect(e) {
    e.preventDefault();
}