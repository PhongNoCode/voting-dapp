const ELECTION_ABI = [
  "function candidatesCount() view returns (uint256)",
  "function candidates(uint256) view returns (uint256 id, string name, uint256 voteCount)",
  "function vote(uint256) external",
  "event votedEvent(uint256 indexed _candidateId)",
];

const connectWalletButton = document.getElementById("connectWalletButton");
const loadContractButton = document.getElementById("loadContractButton");
const voteButton = document.getElementById("voteButton");
const contractAddressInput = document.getElementById("contractAddress");
const accountAddressElement = document.getElementById("accountAddress");
const statusMessage = document.getElementById("statusMessage");
const errorMessage = document.getElementById("errorMessage");
const candidateSelect = document.getElementById("candidateSelect");
const resultsTableBody = document.querySelector("#resultsTable tbody");
const chartCanvas = document.getElementById("voteChart");

let provider;
let signer;
let contract;
let chart;
let contractAddressLoaded = false;

connectWalletButton.addEventListener("click", connectWallet);
loadContractButton.addEventListener("click", loadContract);
voteButton.addEventListener("click", voteForCandidate);

async function connectWallet() {
  clearError();
  if (!window.ethereum) {
    showError("MetaMask không được tìm thấy. Hãy cài đặt MetaMask và thử lại.");
    return;
  }

  provider = new ethers.BrowserProvider(window.ethereum);

  try {
    await provider.send("eth_requestAccounts", []);
    signer = await provider.getSigner();
    const address = await signer.getAddress();
    accountAddressElement.textContent = address;
    showStatus("Wallet connected.");
    window.ethereum.on("accountsChanged", handleAccountChange);
    window.ethereum.on("chainChanged", handleChainChange);
  } catch (error) {
    showError(parseError(error));
  }
}

async function handleAccountChange(accounts) {
  if (accounts.length === 0) {
    accountAddressElement.textContent = "Not connected";
    return;
  }
  accountAddressElement.textContent = accounts[0];
}

function handleChainChange() {
  showStatus("Network changed. Please reload and reconnect.");
}

async function loadContract() {
  clearError();
  if (!window.ethereum) {
    showError("MetaMask không được tìm thấy. Hãy cài đặt MetaMask và thử lại.");
    return;
  }

  const address = contractAddressInput.value.trim();
  if (!address) {
    showError("Hãy nhập địa chỉ contract trước khi load.");
    return;
  }

  if (!ethers.isAddress(address)) {
    showError("Địa chỉ contract không hợp lệ.");
    return;
  }

  setLoading(true, "Loading contract...");

  try {
    if (!provider) {
      await connectWallet();
    }

    signer = await provider.getSigner();
    contract = new ethers.Contract(address, ELECTION_ABI, signer);
    contract.on("votedEvent", handleVotedEvent);
    await refreshResults();
    contractAddressLoaded = true;
    showStatus("Contract loaded. Bạn có thể bỏ phiếu.");
  } catch (error) {
    showError(parseError(error));
  } finally {
    setLoading(false);
  }
}

async function refreshResults() {
  if (!contract) {
    return;
  }

  setLoading(true, "Loading election results...");

  try {
    const count = Number(await contract.candidatesCount());
    const candidates = [];

    for (let i = 1; i <= count; i += 1) {
      const candidate = await contract.candidates(i);
      candidates.push({
        id: Number(candidate.id),
        name: candidate.name,
        votes: Number(candidate.voteCount),
      });
    }

    renderTable(candidates);
    renderCandidateSelect(candidates);
    renderChart(candidates);
  } catch (error) {
    showError(parseError(error));
  } finally {
    setLoading(false);
  }
}

function renderTable(candidates) {
  resultsTableBody.innerHTML = "";
  candidates.forEach((candidate) => {
    const row = document.createElement("tr");
    row.innerHTML = `
      <td>${candidate.id}</td>
      <td>${candidate.name}</td>
      <td>${candidate.votes}</td>
    `;
    resultsTableBody.appendChild(row);
  });
}

function renderCandidateSelect(candidates) {
  candidateSelect.innerHTML = "";
  candidates.forEach((candidate) => {
    const option = document.createElement("option");
    option.value = candidate.id;
    option.textContent = `${candidate.id}. ${candidate.name}`;
    candidateSelect.appendChild(option);
  });
}

function renderChart(candidates) {
  const labels = candidates.map((candidate) => candidate.name);
  const data = candidates.map((candidate) => candidate.votes);

  const chartData = {
    labels,
    datasets: [
      {
        label: "Votes",
        data,
        backgroundColor: ["#2a67f7", "#0d9488", "#f59e0b"],
        borderColor: ["#1e4fd2", "#0f766e", "#d97706"],
        borderWidth: 1,
      },
    ],
  };

  if (chart) {
    chart.data = chartData;
    chart.update();
    return;
  }

  chart = new Chart(chartCanvas, {
    type: "bar",
    data: chartData,
    options: {
      responsive: true,
      plugins: {
        legend: { display: false },
        title: { display: true, text: "Vote distribution" },
      },
      scales: {
        y: { beginAtZero: true, ticks: { precision: 0 } },
      },
    },
  });
}

async function voteForCandidate() {
  if (!contractAddressLoaded || !contract) {
    showError("Hãy load contract trước khi bỏ phiếu.");
    return;
  }

  const candidateId = Number(candidateSelect.value);
  if (!candidateId) {
    showError("Hãy chọn một ứng viên trước khi bỏ phiếu.");
    return;
  }

  setLoading(true, "Sending vote transaction...");

  try {
    const tx = await contract.vote(candidateId);
    showStatus("Đang chờ giao dịch xác nhận...");
    await tx.wait();
    showStatus("Bỏ phiếu thành công!");
    await refreshResults();
  } catch (error) {
    showError(parseError(error));
  } finally {
    setLoading(false);
  }
}

function handleVotedEvent(candidateId) {
  showStatus(`Có phiếu bầu mới cho ứng viên #${candidateId}. Đang cập nhật...`);
  refreshResults();
}

function setLoading(isLoading, message = "") {
  connectWalletButton.disabled = isLoading;
  loadContractButton.disabled = isLoading;
  voteButton.disabled = isLoading || !contractAddressLoaded;
  if (isLoading) {
    statusMessage.textContent = message || "Loading...";
  }
}

function showStatus(message) {
  statusMessage.textContent = message;
  statusMessage.style.display = "block";
  errorMessage.textContent = "";
}

function showError(errorText) {
  errorMessage.textContent = errorText;
  statusMessage.textContent = "";
}

function clearError() {
  errorMessage.textContent = "";
}

function parseError(error) {
  if (!error) {
    return "Có lỗi xảy ra.";
  }

  if (error.code === 4001 || error.code === "ACTION_REJECTED") {
    return "Bạn đã từ chối giao dịch. Vui lòng thử lại nếu muốn bỏ phiếu.";
  }

  if (error.message) {
    if (error.message.includes("insufficient funds")) {
      return "Số dư không đủ để trả phí gas.";
    }
    if (error.message.includes("User rejected request")) {
      return "Bạn đã từ chối giao dịch trên MetaMask.";
    }
    return error.message;
  }

  return "Có lỗi xảy ra khi gọi contract.";
}
