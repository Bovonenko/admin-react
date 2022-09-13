<?php

$file = '../../asdfhiuyhxcv12432_asdf.html';

if (file_exists($file)) {
    unlink($file);              // delete file
} else {
    header("HTTP/1.0 400 Bad Reaquest");
}