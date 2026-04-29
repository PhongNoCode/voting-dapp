// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

contract Election {
    struct Candidate {
        uint id;
        string name;
        uint voteCount;
    }

    address public owner;
    mapping(address => bool) public whitelist;
    mapping(address => bool) public voters;
    mapping(uint => Candidate) public candidates;
    uint public candidatesCount;

    event VoterWhitelisted(address indexed voter);
    event VoteCast(address indexed voter, uint indexed candidateId, uint timestamp);
    event votedEvent(uint indexed _candidateId);

    modifier onlyOwner() {
        require(msg.sender == owner, "Loi: Chi owner moi duoc thuc hien.");
        _;
    }

    constructor() {
        owner = msg.sender;
        addCandidate(unicode"An toàn web");
        addCandidate(unicode"Phân tích mã độc");
        addCandidate(unicode"Dịch vụ đám mây");
    }

    function addCandidate(string memory _name) private {
        candidatesCount++;
        candidates[candidatesCount] = Candidate(candidatesCount, _name, 0);
    }

    function addVoter(address _voter) external onlyOwner {
        whitelist[_voter] = true;
        emit VoterWhitelisted(_voter);
    }

    function vote(uint _candidateId) public {
        require(whitelist[msg.sender], "Loi: Dia chi chua duoc phe duyet.");
        require(!voters[msg.sender], "Loi: Tai khoan nay da bo phieu.");
        require(_candidateId > 0 && _candidateId <= candidatesCount, "Loi: Ung cu vien khong hop le.");

        voters[msg.sender] = true;
        candidates[_candidateId].voteCount++;

        emit VoteCast(msg.sender, _candidateId, block.timestamp);
        emit votedEvent(_candidateId);
    }
}
