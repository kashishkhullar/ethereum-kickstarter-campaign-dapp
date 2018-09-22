pragma solidity^0.4.0;

contract CampaignFactory{
    address[] public deployedCampaigns; 
    
    function createCampaign(uint minimum) public {
        address deployedCampaign = new Campaign(minimum,msg.sender);
        deployedCampaigns.push(deployedCampaign);
    }
    
    function getDeployedCampigns() public view returns(address[]){
        return deployedCampaigns;
    }
}

contract Campaign{
    address public manager;
    uint public minimumContribution;
    mapping(address=>bool) public approvers;
    uint public approversCount;
    
    struct Request{
        string description;
        uint value;
        address recipient;
        bool complete;
        mapping(address=>bool) approvals;
        uint approvalCount;
    }
    
    Request[] public requests;
    
    modifier onlyManager(){
        require(msg.sender == manager,"Not allowed!");
        _;
    }
    
    constructor(uint minimum,address creator) public {
        manager = creator;
        minimumContribution = minimum;
        approversCount = 0;
    }
    
    function contribute() public payable {
        require(msg.value > minimumContribution,"Not enough contribution");
        approvers[msg.sender] = true;
        approversCount++;
        
    }
    
    function createRequest(string description,uint value,address recipient) public onlyManager {
        Request memory request = Request({
            description: description,
            value: value,
            recipient: recipient,
            complete: false,
            approvalCount:0
            
        });
        
        requests.push(request);
        
    }   
    
    function approveRequest(uint index) public {
        
        Request storage request = requests[index];
        
        require(approvers[msg.sender],"Not an approver");
        require(!request.approvals[msg.sender],"Already approved");
        request.approvalCount++;
        request.approvals[msg.sender] = true;
        
    }
    
    function finalizeRequest(uint index) public onlyManager {
        
        Request storage request = requests[index];
        
        require(!request.complete,"Request complete");
        require(request.approvalCount>(approversCount/2),"Not enough votes");
        
        request.recipient.transfer(request.value);
        
        request.complete = true;
        
        
        
    }
    
    
    
    
}