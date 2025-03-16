document.addEventListener("DOMContentLoaded", () => {
  const linkedinUrlInput = document.getElementById("linkedin-url");
  const fetchBtn = document.getElementById("fetch-btn");
  const resultContainer = document.getElementById("result-container");
  const videoPreview = document.getElementById("video-preview");
  const downloadBtn = document.getElementById("download-btn");
  const loadingElement = document.getElementById("loading");
  const errorContainer = document.getElementById("error-container");
  const errorMessage = document.getElementById("error-message");

  // Add event listener to the fetch button
  fetchBtn.addEventListener("click", async () => {
    const linkedinUrl = linkedinUrlInput.value.trim();

    // Validate URL
    if (!linkedinUrl) {
      showError("Please enter a LinkedIn post URL");
      return;
    }

    if (!linkedinUrl.includes("linkedin.com")) {
      showError("Please enter a valid LinkedIn URL");
      return;
    }

    // Clear previous results and show loading
    hideError();
    resultContainer.classList.add("hidden");
    loadingElement.classList.remove("hidden");

    try {
      // Use scrape.do API to bypass LinkedIn's protections
      const scrapeDoToken = "5b7f4c22a13543be9b1446ae31f6880fd0c6c7d28c3";
      const scrapeDoUrl = `https://api.scrape.do?token=${scrapeDoToken}&url=${encodeURIComponent(
        linkedinUrl
      )}`;

      // Fetch the LinkedIn post HTML content
      const response = await fetch(scrapeDoUrl);

      if (!response.ok) {
        throw new Error("Failed to fetch the LinkedIn post");
      }

      const htmlContent = await response.text();

      // Extract video URL from the HTML content
      const videoUrl = extractVideoUrl(htmlContent);

      if (!videoUrl) {
        throw new Error("Could not find a video in this LinkedIn post");
      }

      // Set the video source and show the result container
      videoPreview.src = videoUrl;
      downloadBtn.onclick = () => downloadVideo(videoUrl);

      loadingElement.classList.add("hidden");
      resultContainer.classList.remove("hidden");
    } catch (error) {
      loadingElement.classList.add("hidden");
      showError(error.message);
    }
  });

  // Function to extract video URL from HTML content
  function extractVideoUrl(htmlContent) {
    console.log("Starting video URL extraction...");
    console.log(htmlContent);
    // Step 1: Parse the HTML and get all code tags
    const parser = new DOMParser();
    const doc = parser.parseFromString(htmlContent, "text/html");
    console.log("parsed html", doc);
    const videoElement = doc.querySelector(".share-native-video video");

    const dataSources = JSON.parse(videoElement.getAttribute("data-sources"));

    console.log("data sources", dataSources);
    const videoUrl = dataSources[0].src;
    if (!videoUrl) {
      console.log("No video URL found in any code tag");
    }

    return videoUrl;
  }

  // Function to download the video
  function downloadVideo(videoUrl) {
    // Show loading indicator while downloading
    loadingElement.classList.remove("hidden");

    // Fetch the video as a blob
    fetch(videoUrl)
      .then((response) => {
        if (!response.ok) throw new Error("Failed to download video");
        return response.blob();
      })
      .then((blob) => {
        // Create a blob URL
        const blobUrl = URL.createObjectURL(blob);

        // Create download link
        const a = document.createElement("a");
        a.href = blobUrl;
        a.download = "linkedin-video.mp4";
        a.style.display = "none";

        // Trigger download
        document.body.appendChild(a);
        a.click();

        // Clean up
        setTimeout(() => {
          document.body.removeChild(a);
          URL.revokeObjectURL(blobUrl);
          loadingElement.classList.add("hidden");
        }, 100);
      })
      .catch((error) => {
        loadingElement.classList.add("hidden");
        showError("Failed to download video: " + error.message);
      });
  }

  // Function to show error message
  function showError(message) {
    errorMessage.textContent = message;
    errorContainer.classList.remove("hidden");
  }

  // Function to hide error message
  function hideError() {
    errorContainer.classList.add("hidden");
  }
});
