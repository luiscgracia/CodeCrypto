// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import {IERC20} from "../Interfaces (prueba)/IERC20.sol";
import {IERC20Metadata} from "../Interfaces (prueba)/IERC20Metadata.sol";

contract ERC20 is IERC20, IERC20Metadata {
    mapping(address => uint256) private _balances;

    mapping(address => mapping(address => uint256)) private _allowances;

    uint256 private _totalSupply;

    string private _name;
    string private _symbol;

    constructor(string memory name_, string memory symbol_) {
        _name = name_;
        _symbol = symbol_;
    }

    function name() public view override returns (string memory) {
        return _name;
    }

    function symbol() public view override returns (string memory) {
        return _symbol;
    }

    function decimals() public pure override returns (uint8) {
        return 18;
    }

    /// @inheritdoc IERC20
    function totalSupply() public view override returns (uint256) {
        return _totalSupply;
    }

    /// @inheritdoc IERC20
    function balanceOf(address _account) public view override returns (uint256) {
        return _balances[_account];
    }
    /// @inheritdoc IERC20

    function transfer(address _to, uint256 _amount) public override returns (bool) {
        address owner = msg.sender;
        _transfer(owner, _to, _amount);
        return true;
    }
    /// @inheritdoc IERC20

    function transferFrom(address _from, address _to, uint256 _amount) public override returns (bool) {
        address spender = msg.sender;
        _spendAllowance(_from, spender, _amount);
        _transfer(_from, _to, _amount);
        return true;
    }

    /// @inheritdoc IERC20
    function allowance(address _owner, address _spender) public view override returns (uint256) {
        return _allowances[_owner][_spender];
    }

    /// @inheritdoc IERC20
    function approve(address _spender, uint256 _amount) public override returns (bool) {
        address owner = msg.sender;
        _approve(owner, _spender, _amount);
        return true;
    }

    function _transfer(address _from, address _to, uint256 _amount) internal {
        require(_from != address(0), "ERC20: Transfer from the zero address");
        require(_to != address(0), "ERC20: Transfer to the zero address");

        uint256 fromBalance = _balances[_from];
        require(fromBalance >= _amount, "ERC20: Transfer amount exceeds balance");

        _balances[_from] = fromBalance - _amount;
        _balances[_to] = _amount;

        emit Transfer(_from, _to, _amount);
    }

    function _mint(address _account, uint256 _amount) internal {
        require(_account != address(0), "ERC20: Mint to the zero address");
        _totalSupply += _amount;
        _balances[_account] += _amount;
    }

    function _burn(address _account, uint256 _amount) internal {
        require(_account != address(0), "ERC20: Burn from the zero address");
        uint256 accountBalance = _balances[_account];
        require(accountBalance >= _amount, "ERC20: Burn amount exceeds balance.");
        _balances[_account] = accountBalance - _amount;
        _totalSupply -= _amount;

        emit Transfer(_account, address(0), _amount);
    }

    function _approve(address _owner, address _spender, uint256 _amount) internal {
        require(_owner != address(0), "ERC20: Approve owner the zero address.");
        require(_spender != address(0), "ERC20: Approve to the zero address.");
        _allowances[_owner][_spender] = _amount;
        emit Approval(_owner, _spender, _amount);
    }

    function _spendAllowance(address _owner, address _spender, uint256 _amount) internal {
        uint256 currentAllowance = allowance(_owner, _spender);
        if (currentAllowance != type(uint256).max) {
            require(currentAllowance >= _amount, "ERC20: Insuficient allowance.");
            _approve(_owner, _spender, currentAllowance - _amount);
        }
    }

    function increaseTotalSupply(address _account, uint256 _amount) public {
      _mint(_account, _amount);
    }
}
