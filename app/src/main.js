import React from "react";
import ReactDOM from "react-dom/client";
import Editor from './components/editor';

const root = ReactDOM.createRoot(document.getElementById('root'));
root.render(
    <React.StrictMode>
        <Editor/>
    </React.StrictMode>
)

// function getPageList() {
//     $('h2').remove();
//     $.get('./api/index.php', response => {
//         response.forEach(item => {
//             $('body').append(`<h2>${item}</h2>`);
//         });
//     }, "JSON");
// }

// getPageList();

// $('button').click(() => {
//     $.post('./api/createNewPage.php', {
//         "name": $('input').val()
//     }, getPageList)
//     .fail(() => {
//         alert('This file alreardy exists');
//     });
// });

// const arr = [1, 2, 5, 6, 7];

// console.log(arr.at(-1));