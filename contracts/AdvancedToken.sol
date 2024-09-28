// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

import "@openzeppelin/contracts/token/ERC20/ERC20.sol";
import "@openzeppelin/contracts/token/ERC20/extensions/ERC20Burnable.sol";
import "@openzeppelin/contracts/security/Pausable.sol";
import "@openzeppelin/contracts/access/AccessControl.sol";
import "@openzeppelin/contracts/utils/math/SafeMath.sol";

contract AdvancedToken is ERC20, ERC20Burnable, Pausable, AccessControl {
    using SafeMath for uint256;

    bytes32 public constant PAUSER_ROLE = keccak256("PAUSER_ROLE");
    bytes32 public constant MINTER_ROLE = keccak256("MINTER_ROLE");
    
    uint256 public constant MAX_SUPPLY = 1000000 * 10**18; // 1 million tokens
    uint256 public constant INITIAL_SUPPLY = 100000 * 10**18; // 100,000 tokens
    
    uint256 public constant TRANSFER_FEE_RATE = 1; // 0.1% transfer fee
    address public feeCollector;
    
    mapping(address => bool) private _blacklist;
    
    event Blacklisted(address indexed account);
    event UnBlacklisted(address indexed account);
    event FeeCollected(address indexed from, address indexed to, uint256 amount);

    constructor(string memory name, string memory symbol) ERC20(name, symbol) {
        _setupRole(DEFAULT_ADMIN_ROLE, msg.sender);
        _setupRole(PAUSER_ROLE, msg.sender);
        _setupRole(MINTER_ROLE, msg.sender);
        
        feeCollector = msg.sender;
        _mint(msg.sender, INITIAL_SUPPLY);
    }

    function mint(address to, uint256 amount) public onlyRole(MINTER_ROLE) {
        require(totalSupply().add(amount) <= MAX_SUPPLY, "Exceeds max supply");
        _mint(to, amount);
    }

    function pause() public onlyRole(PAUSER_ROLE) {
        _pause();
    }

    function unpause() public onlyRole(PAUSER_ROLE) {
        _unpause();
    }

    function blacklist(address account) public onlyRole(DEFAULT_ADMIN_ROLE) {
        _blacklist[account] = true;
        emit Blacklisted(account);
    }

    function unBlacklist(address account) public onlyRole(DEFAULT_ADMIN_ROLE) {
        _blacklist[account] = false;
        emit UnBlacklisted(account);
    }

    function setFeeCollector(address newFeeCollector) public onlyRole(DEFAULT_ADMIN_ROLE) {
        feeCollector = newFeeCollector;
    }

    function transfer(address recipient, uint256 amount) public virtual override returns (bool) {
        return _transferWithFee(_msgSender(), recipient, amount);
    }

    function transferFrom(address sender, address recipient, uint256 amount) public virtual override returns (bool) {
        uint256 currentAllowance = allowance(sender, _msgSender());
        require(currentAllowance >= amount, "ERC20: transfer amount exceeds allowance");
        unchecked {
            _approve(sender, _msgSender(), currentAllowance - amount);
        }
        return _transferWithFee(sender, recipient, amount);
    }

    function _transferWithFee(address sender, address recipient, uint256 amount) internal returns (bool) {
        require(!_blacklist[sender] && !_blacklist[recipient], "Blacklisted address");
        
        uint256 fee = amount.mul(TRANSFER_FEE_RATE).div(1000);
        uint256 amountAfterFee = amount.sub(fee);

        _transfer(sender, recipient, amountAfterFee);
        _transfer(sender, feeCollector, fee);

        emit FeeCollected(sender, recipient, fee);
        return true;
    }

    function _beforeTokenTransfer(address from, address to, uint256 amount)
        internal
        whenNotPaused
        override
    {
        super._beforeTokenTransfer(from, to, amount);
    }
}