function convertText() {
  // Get the input text from the text area
  var inputText = document.getElementById("input-text").value;
  console.log(inputText);
  // Split the input text into paragraphs
  var paragraphs = inputText.split(/\r?\n/);
  console.log(paragraphs);

  // Process each paragraph separately
  var outputParagraphs = paragraphs.map(function (paragraph) {
    // Split the paragraph into words and modify each word
    var words = paragraph.split(" ");
    var modifiedWords = words.map(function (word) {
      var mid = Math.ceil(word.length / 2);
      if (word.length % 2 === 1 && (word.endsWith(".") || word.endsWith(","))) {
        mid--;
      }
      var firstHalf = word.substring(0, mid);
      var secondHalf = word.substring(mid);
      firstHalf = firstHalf.replace(/[\u00A0-\u9999<>\&]/gim, function (i) {
        return "&#" + i.charCodeAt(0) + ";";
      });
      secondHalf = secondHalf.replace(/[\u00A0-\u9999<>\&]/gim, function (i) {
        return "&#" + i.charCodeAt(0) + ";";
      });
      return "<b>" + firstHalf + "</b>" + secondHalf;
    });

    // Join the modified words back into a single string
    return modifiedWords.join(" ");
  });

  // Join the output paragraphs back into a single string with line breaks
  var outputText = outputParagraphs.join("<br>");
  console.log(outputText);

  // Set the output text in the output area
  document.getElementById("output-text").innerHTML = outputText;

  // Show the download button
  var downloadBtn = document.getElementById("download-btn");
  var downloadtext = document.getElementById("download-text")
  var convertedtext = document.getElementById("converted-text")
  var outtext = document.getElementById("output-text")

  downloadBtn.style.display = "block";
  downloadtext.style.display  = "block";
  convertedtext.style.display = "block";
  outtext.style.display = "block";

  downloadBtn.onclick = function () {
    // Create a blob object from the output text
    var blob = new Blob([outputText], {type: "text/plain;charset=utf-8"});

    // Create a temporary anchor element to trigger the download
    var downloadLink = document.createElement("a");
    downloadLink.href = URL.createObjectURL(blob);
    downloadLink.download = "Bionic_Reading.txt";

    // Click the anchor element to trigger the download
    document.body.appendChild(downloadLink);
    downloadLink.click();
    document.body.removeChild(downloadLink);
  };
}

var convertBtn = document.getElementById("convert-btn");
convertBtn.addEventListener("click", convertText);

const toggleSwitch = document.querySelector('.switch input[type="checkbox"]');

function switchTheme(e) {
  if (e.target.checked) {
    document.documentElement.setAttribute('data-theme', 'dark');
    document.body.classList.add('dark-mode');
  } else {
    document.documentElement.setAttribute('data-theme', 'light');
    document.body.classList.remove('dark-mode');
  }
}

toggleSwitch.addEventListener('change', switchTheme, false);
