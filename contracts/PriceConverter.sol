//SPDX-License-Identifier: MIT

pragma solidity ^0.8.0;

import "@chainlink/contracts/src/v0.8/interfaces/AggregatorV3Interface.sol";
import "hardhat/console.sol";

library PriceConverter {
    
    function getPrice(AggregatorV3Interface _priceFeed)
        internal
        view
        returns (uint256)
    {
        (, int256 price, , , ) = _priceFeed.latestRoundData();
        return uint256(price * 1e10);
    }

    function getEthConversionRate(
        uint256 ethAmount,
        AggregatorV3Interface priceFeed
    ) internal view returns (uint256) {
        uint256 ethPrice = getPrice(priceFeed);
        uint256 ethAmountInX = (ethPrice * ethAmount) / 1e18;
        return ethAmountInX;
    }

    /** @dev must include 8 decimal places after your amount */
    function getXConversionRate(uint256 amount, AggregatorV3Interface priceFeed)
        internal
        view
        returns (uint256) 
    {
        uint256 ethPrice = getPrice(priceFeed); // 10 000 (00000 00000 00000) / 1400 000 (00000 00000 00000) => (multipledAmount / ethPrice)
        uint256 multipliedAmount = amount * 1e14; //* 1e10; Changed logic so multipledAmount is always bigger than ethPrice. 
        uint256 xAmountInEth = (multipliedAmount / ethPrice) * 1e14; // * 1e18 (ghetto solution? perhaps.)
        return xAmountInEth;
    }

    /* 1 ETHER = $5 USD
        amount / price = answer
        how much ETHER does $1 USD get me?
        1 / 5 = .2 
        how much ETHER does $20 USD get me?
        20 / 5 = 4
    */
}