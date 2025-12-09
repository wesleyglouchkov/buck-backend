import {
    Body,
    Button,
    Container,
    Head,
    Html,
    Preview,
    Section,
    Text,
} from "@react-email/components";
import * as React from "react";

interface AccountWarningEmailProps {
    username?: string;
    warningMessage?: string;
    warningCount?: number;
    maxWarnings?: number;
}

export const AccountWarningEmail = ({
    username = "User",
    warningMessage = "A violation of our community guidelines",
    warningCount = 1,
}: AccountWarningEmailProps) => {
    return (
        <Html>
            <Head />
            <Preview>Buck - Account Warning</Preview>
            <Body style={main}>
                <Container style={container}>
                    <Section>
                        <Text style={text}>Hi {username},</Text>
                        <Text style={text}>
                            We're reaching out to inform you about a recent issue with your account:
                        </Text>
                        <div style={warningBox}>
                            <Text style={warningText}>"{warningMessage}"</Text>
                        </div>
                        <Text style={text}>
                            This is warning <strong>{warningCount} </strong> before your account may be subject to suspension.
                        </Text>
                        <Text style={text}>
                            <strong>Please be advised:</strong> Further violations may result in temporary or permanent suspension of your account.
                        </Text>
                        <Text style={text}>
                            If you believe this warning was issued in error, please contact our support team immediately.
                        </Text>
                        <Text style={text}>
                            <small style={smallText}>
                                This is an automated message. Please do not reply to this email.
                            </small>
                        </Text>
                    </Section>
                </Container>
            </Body>
        </Html>
    );
};

export default AccountWarningEmail;

const main = {
    backgroundColor: "#f6f9fc",
    padding: "10px 0",
};

const container = {
    backgroundColor: "#ffffff",
    border: "1px solid #f0f0f0",
    padding: "45px",
};

const text = {
    fontSize: "16px",
    fontFamily:
        "'Open Sans', 'HelveticaNeue-Light', 'Helvetica Neue Light', 'Helvetica Neue', Helvetica, Arial, 'Lucida Grande', sans-serif",
    fontWeight: "300",
    color: "#404040",
    lineHeight: "26px",
    margin: "16px 0",
};

const warningBox = {
    backgroundColor: "#FFF3E0",
    borderLeft: "4px solid #FFA000",
    padding: "12px",
    margin: "16px 0",
    borderRadius: "4px"
};

const warningText = {
    ...text,
    fontStyle: "italic",
    margin: 0,
};

const smallText = {
    fontSize: "14px",
    color: "#666",
    margin: 0,
};
