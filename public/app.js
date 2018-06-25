$("#scrape").on("click", function () {
    $.ajax({
        method: "GET",
        url: "/scrape",
    }).then(function (data) {
        window.location = "/"
    })
    console.log("scrape complete");

});

$(".navbar-nav li").on("click", function () {
    $(".navbar-nav li").removeClass("active");
    $(this).addClass("active");
});

$(".saveButton").on("click", function (event) {
    event.preventDefault()
    var id = $(this).attr("data-id");
    $.ajax({
        method: "POST",
        url: "/articles/save/" + id
    }).then(function (data) {
        console.log(id, "saved");
        window.location = "/"
    })
});

$(".delete").on("click", function () {
    var thisId = $(this).attr("data-id");
    $.ajax({
        method: "POST",
        url: "/articles/delete/" + thisId
    }).then(function (data) {
        window.location = "/saved"
    })
});

$(".saveNote").on("click", function (event) {
    var thisId = $(this).attr("data-id");
    $.ajax({
        method: "POST",
        url: "/notes/save/" + thisId,
        data: {
            text: $("#noteField").val()
        }
    }).then(function (data) {
        $("#noteField").val();
        window.location = "/saved"
    });

});

$(".deleteNote").on("click", function () {
    var noteId = $(this).attr("data-note-id");
    var articleId = $(this).attr("data-article-id");
    $.ajax({
        method: "DELETE",
        url: "/notes/delete/" + noteId + "/" + articleId
    }).then(function (data) {
        console.log(data)
        window.location = "/saved"
    })
});

