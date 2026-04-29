import { expect } from "chai";
import hre from "hardhat";

describe("Hệ thống Bầu chọn môn học tự chọn", function () {
    let election;
    let owner, addr1, addr2;

    beforeEach(async function () {
        [owner, addr1, addr2] = await hre.ethers.getSigners();
        const Election = await hre.ethers.getContractFactory("Election");
        election = await Election.deploy();
    });

    it("8. Khởi tạo đúng số lượng ứng cử viên", async function () {
        expect(await election.candidatesCount()).to.equal(3);
    });

    it("9. Kiểm tra thông tin của từng ứng cử viên", async function () {
        const candidates = [
            { id: 1, name: "An toàn web" },
            { id: 2, name: "Phân tích mã độc" },
            { id: 3, name: "Dịch vụ đám mây" },
        ];

        for (const candidate of candidates) {
            const result = await election.candidates(candidate.id);
            expect(result.id).to.equal(candidate.id);
            expect(result.name).to.equal(candidate.name);
            expect(result.voteCount).to.equal(0);
        }
    });

    it("10. Một tài khoản có thể bỏ phiếu thành công và voteCount tăng lên 1", async function () {
        await election.connect(owner).addVoter(addr1.address);
        await election.connect(addr1).vote(1);

        const candidate = await election.candidates(1);
        expect(candidate.voteCount).to.equal(1);
    });

    it("11. Từ chối bỏ phiếu cho ứng cử viên không hợp lệ", async function () {
        await election.connect(owner).addVoter(addr1.address);
        await expect(election.connect(addr1).vote(99)).to.be.revertedWith("Loi: Ung cu vien khong hop le.");
    });

    it("12. Từ chối bỏ phiếu hai lần từ cùng một tài khoản", async function () {
        await election.connect(owner).addVoter(addr2.address);
        await election.connect(addr2).vote(2);
        await expect(election.connect(addr2).vote(2)).to.be.revertedWith("Loi: Tai khoan nay da bo phieu.");
    });

    it("13. Kiểm tra event votedEvent được phát ra đúng với candidateId", async function () {
        await election.connect(owner).addVoter(addr1.address);
        await expect(election.connect(addr1).vote(3))
            .to.emit(election, "votedEvent")
            .withArgs(3);
    });
});
