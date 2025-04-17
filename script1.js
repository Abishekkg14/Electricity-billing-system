function toggleAnswer(element) {
    var answer = element.nextElementSibling;
    if (answer.style.display === "block") {
        answer.style.display = "none";
    } else {
        answer.style.display = "block";
    }
}

function toggleMenu() {
    var menu = document.querySelector(".menu");
    menu.classList.toggle("active");
}
