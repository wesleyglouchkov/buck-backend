
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
import dayjs from "dayjs";
import utc from "dayjs/plugin/utc";
import timezone from "dayjs/plugin/timezone";

dayjs.extend(utc);
dayjs.extend(timezone);

interface StreamNotificationEmailProps {
    type: 'live_now' | 'scheduled' | 'reminder' | 'cancelled' | 'updated';
    memberName: string;
    creatorName: string;
    streamTitle: string;
    workoutType?: string;
    streamId: string;
    startTime?: Date;
    timezone?: string;
}

export const StreamNotificationEmail = ({
    type,
    memberName,
    creatorName,
    streamTitle,
    workoutType,
    streamId,
    startTime = new Date(),
    timezone = "UTC",
}: StreamNotificationEmailProps) => {

    const frontendUrl = process.env.FRONTEND_URL;
    const streamUrl = `${frontendUrl}/live/${streamId}`;

    // Format time for specified timezone
    const formattedTime = startTime
        ? dayjs(startTime).tz(timezone).format('MMMM D, YYYY at h:mm A z')
        : '';

    const getPreview = () => {
        switch (type) {
            case 'live_now':
                return `${creatorName} is live! Join ${streamTitle} now.`;
            case 'scheduled':
                return `New live stream scheduled: ${streamTitle}`;
            case 'reminder':
                return `Starting soon: ${streamTitle}`;
            case 'cancelled':
                return `Stream cancelled: ${streamTitle}`;
            case 'updated':
                return `Stream updated: ${streamTitle}`;
            default:
                return 'Stream Notification';
        }
    };

    return (
        <Html>
            <Head />
            <Preview>{getPreview()}</Preview>
            <Body style={main}>
                <Container style={container}>
                    <Section>
                        <Text style={text}>Hi {memberName},</Text>

                        {/* LIVE NOW Content */}
                        {type === 'live_now' && (
                            <>
                                <Text style={text}>
                                    <strong>{creatorName}</strong> just started a live stream!
                                </Text>
                                <div style={infoBox}>
                                    <Text style={heading}>{streamTitle}</Text>
                                    {workoutType && <Text style={subtext}>🏋️ {workoutType}</Text>}
                                </div>
                                <Text style={text}>Don't miss out on the action!</Text>
                            </>
                        )}

                        {/* SCHEDULED Content */}
                        {type === 'scheduled' && (
                            <>
                                <Text style={text}>
                                    <strong>{creatorName}</strong> has scheduled a new live stream!
                                </Text>
                                <div style={infoBox}>
                                    <Text style={heading}>{streamTitle}</Text>
                                    {workoutType && <Text style={subtext}>🏋️ {workoutType}</Text>}
                                    <Text style={timeText}>
                                        🕐 {formattedTime}
                                    </Text>
                                </div>
                                <Text style={text}>Mark your calendar!</Text>
                            </>
                        )}

                        {/* REMINDER Content */}
                        {type === 'reminder' && (
                            <>
                                <Text style={text}>
                                    Reminder: <strong>{creatorName}</strong>'s live stream starts in 15 minutes!
                                </Text>
                                <div style={infoBox}>
                                    <Text style={heading}>{streamTitle}</Text>
                                    <Text style={timeText}>Starting at {formattedTime}</Text>
                                </div>
                            </>
                        )}

                        {/* CANCELLED Content */}
                        {type === 'cancelled' && (
                            <>
                                <Text style={text}>
                                    We're sorry to inform you that <strong>{creatorName}</strong>'s scheduled live stream has been cancelled.
                                </Text>
                                <div style={cancelledInfoBox}>
                                    <Text style={heading}>{streamTitle}</Text>
                                    {workoutType && <Text style={subtext}>🏋️ {workoutType}</Text>}
                                    {formattedTime && (
                                        <Text style={subtext}>
                                            Originally scheduled for: {formattedTime}
                                        </Text>
                                    )}
                                </div>
                                <Text style={text}>
                                    We apologize for any inconvenience. Stay tuned for future streams!
                                </Text>
                            </>
                        )}

                        {/* UPDATED Content */}
                        {type === 'updated' && (
                            <>
                                <Text style={text}>
                                    <strong>{creatorName}</strong> has updated their scheduled live stream!
                                </Text>
                                <div style={updatedInfoBox}>
                                    <Text style={heading}>{streamTitle}</Text>
                                    {workoutType && <Text style={subtext}>🏋️ {workoutType}</Text>}
                                    {formattedTime && (
                                        <Text style={timeText}>
                                            🕐 New Time: {formattedTime}
                                        </Text>
                                    )}
                                </div>
                                <Text style={text}>
                                    Please update your calendar with the new details!
                                </Text>
                            </>
                        )}

                        {type !== 'cancelled' && (
                            <>
                                <Button style={button} href={streamUrl}>
                                    {type === 'live_now' ? 'Join Stream Now' : 'View Stream Details'}
                                </Button>

                                <Text style={text}>
                                    See you there!
                                </Text>
                            </>
                        )}
                    </Section>
                </Container>
            </Body>
        </Html>
    );
};

export default StreamNotificationEmail;

const main = {
    backgroundColor: "#f6f9fc",
    padding: "10px 0",
};

const container = {
    backgroundColor: "#ffffff",
    border: "1px solid #f0f0f0",
    borderRadius: "5px",
    padding: "45px",
    maxWidth: "580px",
    margin: "0 auto",
};

const text = {
    fontSize: "16px",
    fontFamily: "'Open Sans', 'HelveticaNeue-Light', 'Helvetica Neue Light', 'Helvetica Neue', Helvetica, Arial, 'Lucida Grande', sans-serif",
    fontWeight: "300",
    color: "#404040",
    lineHeight: "26px",
};

const infoBox = {
    backgroundColor: "#f9f9f9",
    padding: "20px",
    borderRadius: "8px",
    margin: "20px 0",
    border: "1px solid #eaeaea",
};

const cancelledInfoBox = {
    backgroundColor: "#fff5f5",
    padding: "20px",
    borderRadius: "8px",
    margin: "20px 0",
    border: "1px solid #feb2b2",
};

const updatedInfoBox = {
    backgroundColor: "#ebf8ff",
    padding: "20px",
    borderRadius: "8px",
    margin: "20px 0",
    border: "1px solid #90cdf4",
};

const heading = {
    fontSize: "20px",
    fontWeight: "bold",
    color: "#1a1a1a",
    margin: "0 0 10px 0",
};

const subtext = {
    fontSize: "16px",
    color: "#666666",
    margin: "5px 0",
};

const timeText = {
    fontSize: "16px",
    color: "#007ee6",
    fontWeight: "bold",
    margin: "10px 0 0 0",
};

const smallText = {
    fontSize: "12px",
    color: "#999999",
    fontWeight: "normal",
};

const button = {
    backgroundColor: "#007ee6",
    borderRadius: "4px",
    color: "#fff",
    fontFamily: "'Open Sans', 'Helvetica Neue', Arial",
    fontSize: "16px",
    textDecoration: "none",
    textAlign: "center" as const,
    display: "block",
    width: "100%",
    padding: "14px 0",
    marginTop: "20px",
    fontWeight: "bold",
};
